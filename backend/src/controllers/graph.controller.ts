import { NextFunction, Request, Response } from 'express';
import { ApiError } from '@risk-terminal/shared';
import {
    CHAIN_IDS,
    DEFAULT_GRAPH_DEPTH,
    MAX_GRAPH_DEPTH,
} from '../config/config';
import { buildDependencyGraph } from '../services/graph.service';

/**
 * Ethereum address: 0x followed by exactly 40 hex characters.
 */
const ETH_ADDRESS_REGEX = /^0x[0-9a-fA-F]{40}$/;

/**
 * Expected request body for POST /api/graph.
 *
 * @param address - Root contract address (validated against ETH_ADDRESS_REGEX).
 * @param depth - Optional BFS depth. Bounded by [1, MAX_GRAPH_DEPTH]. Defaults to DEFAULT_GRAPH_DEPTH.
 * @param chain_id - Numeric chain ID. Must appear in CHAIN_IDS.
 */
interface GraphRequestBody {
    address: string;
    depth?: number;
    chain_id: number;
}

/**
 * Set of supported chain IDs for O(1) membership checks.
 */
const SUPPORTED_CHAIN_IDS = new Set<number>(Object.values(CHAIN_IDS));

/**
 * POST /api/graph controller.
 * Validates input, dispatches to the graph service, sends the response.
 *
 * Validation errors return 400 with a typed `ApiError`.
 * Service errors are forwarded via `next(err)` to the global error middleware.
 */
export async function buildGraph(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    const { address, depth = DEFAULT_GRAPH_DEPTH, chain_id } = req.body as GraphRequestBody;

    if (!address || !ETH_ADDRESS_REGEX.test(address)) {
        const error: ApiError = {
            code: 'INVALID_ADDRESS',
            message: 'Request body must include a valid Ethereum address (0x + 40 hex chars).',
        };
        res.status(400).json(error);
        return;
    }

    if (!Number.isInteger(depth) || depth < 1 || depth > MAX_GRAPH_DEPTH) {
        const error: ApiError = {
            code: 'DEPTH_EXCEEDED',
            message: `Depth must be an integer between 1 and ${MAX_GRAPH_DEPTH}.`,
        };
        res.status(400).json(error);
        return;
    }

    if (!SUPPORTED_CHAIN_IDS.has(chain_id)) {
        const error: ApiError = {
            code: 'INVALID_CHAIN_ID',
            message: `Chain ID ${chain_id} is not supported. Supported chain IDs: ${Array.from(SUPPORTED_CHAIN_IDS).join(', ')}.`,
        };
        res.status(400).json(error);
        return;
    }

    try {
        const graph = await buildDependencyGraph(address, depth, chain_id);
        res.status(200).json(graph);
    } catch (err) {
        next(err);
    }
}
