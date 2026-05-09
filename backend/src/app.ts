import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import graphRouter from './routes/graph.router';
import aiRouter from './routes/ai.router';
import { errorMiddleware } from './middleware/error.middleware';
import {
    RATE_LIMIT_MAX_REQUESTS,
    RATE_LIMIT_WINDOW_MS,
    SERVER,
} from './config/config';

const app = express();

/**
 * Global middleware — runs on every request before it reaches a route.
 *
 *   helmet           — sets safe HTTP security headers (XSS, clickjacking, MIME sniffing).
 *   cors             — allows the frontend origin to call this API from the browser.
 *   express.json     — parses application/json request bodies into req.body.
 *   rate limiter     — caps requests per IP to protect upstream API budgets.
 */
app.use(helmet());
app.use(cors({
        origin: "*"
    }));
app.use(express.json({ limit: '10mb' }));
app.use(
    rateLimit({
        windowMs: RATE_LIMIT_WINDOW_MS,
        max: RATE_LIMIT_MAX_REQUESTS,
        standardHeaders: true,
        legacyHeaders: false,
    }),
);

/* ==================== Routes ==================== */

app.use('/api', graphRouter);
app.use('/api', aiRouter);

app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
});

/* ==================== Error handler ==================== */

// Must be the last middleware mounted so it catches errors from any prior layer.
app.use(errorMiddleware);

app.listen(SERVER.port, () => {
    console.log(`Server running on port ${SERVER.port}`);
});
