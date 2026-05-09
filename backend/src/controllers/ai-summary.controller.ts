import { Request, Response, NextFunction } from 'express';
import { generateProtocolSummary } from '../services/ai-summary.service';
import type { GraphResponse } from '@risk-terminal/shared';

/**
 * POST /api/ai/summary
 * Generate AI summary for a protocol graph
 */
export async function generateSummary(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const graphData: GraphResponse = req.body;

        if (!graphData || !graphData.nodes || !graphData.edges) {
            res.status(400).json({
                error: 'Invalid graph data provided'
            });
            return;
        }

        const summary = await generateProtocolSummary(graphData);

        res.json({ summary });
    } catch (error) {
        next(error);
    }
}
