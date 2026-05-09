import { Router } from 'express';
import { generateSummary } from '../controllers/ai-summary.controller';

const router = Router();

// POST /api/ai/summary
// Body: GraphResponse
router.post('/ai/summary', generateSummary);

export default router;
