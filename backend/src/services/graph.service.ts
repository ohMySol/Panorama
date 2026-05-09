import type { GraphEdge, GraphNode, GraphResponse } from '@risk-terminal/shared';
import { MAX_GRAPH_NODES } from '../config/config';
import { resolveContract } from './resolver.service';
import {
    executeManifest,
    selectManifest,
    type AdapterDependency,
    type AdapterKind,
} from './manifests';
import { runRiskChecks } from './risk';
import { scoreGraph, scoreNode } from './scorer.service';

/**
 * Builds a complete dependency graph for a contract via breadth-first traversal.
 *
 * Algorithm:
 *   1. Seed a queue with the root address at depth 0.
 *   2. While the queue is non-empty AND the node budget allows:
 *      a. Pop the next address.
 *      b. Resolve it (Sourcify → Etherscan → Unknown).
 *      c. Run the router to choose an adapter.
 *      d. Run the adapter to discover outbound dependencies.
 *      e. Run risk checks, score the node, store it.
 *      f. Enqueue dependencies that are within depth and not yet seen.
 *   3. Compute the overall graph risk score.
 *
 * Why BFS instead of recursion:
 *   - Constant-stack — depth-5 graphs of fan-out 10 produce 10⁵ nodes if unbounded;
 *     recursion would risk stack overflow.
 *   - Natural deduplication — the seen-set is right next to the queue.
 *   - Clean depth cutoff — we know each node's depth at enqueue time.
 *
 * @param rootAddress - The address the user submitted.
 * @param maxDepth - Maximum BFS depth (root is depth 0).
 * @param chainId - Chain to operate on.
 * @returns A complete `GraphResponse` matching the shared contract.
 */
export async function buildDependencyGraph(
    rootAddress: string,
    maxDepth: number,
    chainId: number,
): Promise<GraphResponse> {
    const normalizedRoot = rootAddress.toLowerCase();

    const nodesByAddress = new Map<string, GraphNode>();
    const depthByAddress = new Map<string, number>();
    const edges: GraphEdge[] = [];

    interface QueueItem {
        address: string;
        depth: number;
    }
    const queue: QueueItem[] = [{ address: rootAddress, depth: 0 }];
    // This is a deduplication guard. Before pushing a dependency onto the queue, the code checks if its address is already in `seen`.
    // This is done because multiple contracts can depend on the same thing (e.g. both a vault and a market might reference USDC).
    const seen = new Set<string>([normalizedRoot]);
    depthByAddress.set(normalizedRoot, 0);

    while (queue.length > 0 && nodesByAddress.size < MAX_GRAPH_NODES) {
        const { address, depth } = queue.shift() as QueueItem;

        // 1. Resolve the contract. Tries Sourcify → Etherscan → bytecode
        const resolved = await resolveContract(address, chainId);
        // 2. Match the contract's ABI against the manifest registry. `null` ⇒ fallback / leaf.
        const manifest = resolved.abi ? selectManifest(resolved.abi) : null;
        const adapterKind: AdapterKind = manifest?.id ?? 'fallback';

        // 3. Run the manifest executor to discover dependencies of the current contract.
        let dependencies: AdapterDependency[] = [];
        if (manifest && resolved.abi && depth < maxDepth) {
            try {
                dependencies = await executeManifest(manifest, resolved.address, resolved.abi, chainId);
            } catch (err) {
                const message = err instanceof Error ? err.message : 'unknown error';
                console.warn(`[graph] manifest ${adapterKind} failed for ${address}: ${message}`);
            }
        }

        // 4. Run here specific checks based on the adapter kind (universal, erc-20, etc) and compute the node risk score.
        const findings = runRiskChecks(resolved.abi, adapterKind);
        const riskScore = scoreNode(resolved.tier, findings);

        const node: GraphNode = {
            address: resolved.address,
            name: resolved.name,
            tier: resolved.tier,
            abi: resolved.abi ? JSON.stringify(resolved.abi) : null,
            sourceAvailable: resolved.sourceAvailable,
            riskScore,
            riskFlags: findings.map((f) => f.label),
            tvlUsd: null,
            type: adapterKind,
        };
        nodesByAddress.set(resolved.address.toLowerCase(), node);

        // 5. Store node, push edges, enqueue dependencies. Honour `dep.from` so
        //    that adapter-anchored edges (e.g. Morpho markets owned by Morpho
        //    Blue, not the vault that referenced them) are attributed correctly.
        for (const dep of dependencies) {
            const edgeFrom = dep.from ?? resolved.address;
            edges.push({ from: edgeFrom, to: dep.to, type: dep.type });

            const depKey = dep.to.toLowerCase();
            if (seen.has(depKey)) continue;
            if (nodesByAddress.size + queue.length >= MAX_GRAPH_NODES) break;

            const anchorDepth = dep.from
                ? (depthByAddress.get(dep.from.toLowerCase()) ?? depth)
                : depth;

            seen.add(depKey);
            depthByAddress.set(depKey, anchorDepth + 1);
            queue.push({ address: dep.to, depth: anchorDepth + 1 });
        }
    }

    const nodes = Array.from(nodesByAddress.values());
    // 6. Weighted average of riskScores.
    const riskScore = scoreGraph(nodes, rootAddress, depthByAddress);

    return {
        root: rootAddress,
        nodes,
        edges,
        graphRiskScore: riskScore,
        summary: null,
    };
}
