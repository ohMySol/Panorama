import { Router } from 'express';
import { buildGraph } from '../controllers/graph.controller';

const router = Router();

// POST /api/graph
// Body: { address: string, depth?: number }
router.post('/graph', buildGraph);

export default router;
