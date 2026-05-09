import type { GraphNode, GraphEdge } from "@risk-terminal/shared";

/**
 * Get the display name for a node based on its type and incoming edge
 */
export function getNodeDisplayName(
    node: GraphNode,
    incomingEdge: GraphEdge | undefined,
    isRoot: boolean = false
): string {
    const shortAddress = `${node.address.slice(0, 6)}...${node.address.slice(-4)}`;
    let label = node.name || shortAddress;

    // Special handling for root node
    if (isRoot) {
        // For root: show "type + category" as label
        const typeLabel = node.type.toUpperCase();
        const categoryLabel = node.category ? ` ${node.category}` : '';
        return `${typeLabel}${categoryLabel}`;
    }

    // Special handling for morphoBlue type
    if (node.type === "morphoBlue") {
        // For morphoBlue: show "name + category" as label
        const nameLabel = node.name || shortAddress;
        const categoryLabel = node.category ? ` ${node.category}` : '';
        return `${nameLabel}${categoryLabel}`;
    }

    if (node.type === "erc20") {
        // For ERC20 tokens, show symbol as label
        if (node.metadata?.symbol) {
            label = String(node.metadata.symbol);
        }
    } else if (node.type === "safe") {
        // For Safe multisig, show edge type as label with capitalization
        if (incomingEdge) {
            label = incomingEdge.type.charAt(0).toUpperCase() + incomingEdge.type.slice(1);
        }
    } else if (incomingEdge?.type === "oracle") {
        // For oracle edges, show "Oracle" as label
        label = "Oracle";
    }

    return label;
}

/**
 * Get the subtitle for a node based on its type and incoming edge
 */
export function getNodeSubtitle(
    node: GraphNode,
    incomingEdge: GraphEdge | undefined,
    isRoot: boolean = false
): string {
    const shortAddress = `${node.address.slice(0, 6)}...${node.address.slice(-4)}`;
    let subtitle = node.type.toUpperCase();

    // Special handling for root node
    if (isRoot) {
        // For root: show name as subtitle
        return node.name || shortAddress;
    }

    // Special handling for morphoBlue type
    if (node.type === "morphoBlue") {
        // For morphoBlue: show "morphoBlue" as subtitle
        return "morphoBlue";
    }

    if (node.type === "erc20") {
        // For ERC20 tokens, show edge type as subtitle
        if (incomingEdge) {
            subtitle = incomingEdge.type;
        }
    } else if (node.type === "safe") {
        // For Safe multisig, show "Multisig" as subtitle
        subtitle = "Multisig";
    } else if (incomingEdge?.type === "oracle") {
        // For oracle edges, show node name as subtitle
        subtitle = node.name || shortAddress;
    }

    return subtitle;
}
