import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import { resolveUserId } from './middleware/userId.js';
import { pathAllowlist } from './middleware/pathAllowlist.js';

import healthRoute from './routes/health.js';
import heroRoute from './routes/hero.js';
import browseRoute from './routes/browse.js';
import rowsRoute from './routes/rows.js';
import searchRoute from './routes/search.js';
import titleRoute from './routes/title.js';
import sourceRoute from './routes/source.js';
import progressRoute from './routes/progress.js';
import watchlistRoute from './routes/watchlist.js';
import ratingsRoute from './routes/ratings.js';
import historyRoute from './routes/history.js';
import continueWatchingRoute from './routes/continueWatching.js';
import externalRoute from './routes/external.js';
import eventsRoute from './routes/events.js';

const app = express();

// comma-separated so preview deployments can be allowed alongside prod, e.g.
// CLIENT_ORIGIN=https://pazia.vercel.app,https://pazia-git-preview.vercel.app
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(helmet());
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());
app.use(rateLimit({ windowMs: 60 * 1000, max: 120 }));
app.use(resolveUserId);
app.use('/api', pathAllowlist);

app.use('/api/health', healthRoute);
app.use('/api/hero', heroRoute);
app.use('/api/browse', browseRoute);
app.use('/api/rows', rowsRoute);
app.use('/api/search', searchRoute);
app.use('/api/title', titleRoute);
app.use('/api/source', sourceRoute);
app.use('/api/progress', progressRoute);
app.use('/api/watchlist', watchlistRoute);
app.use('/api/ratings', ratingsRoute);
app.use('/api/history', historyRoute);
app.use('/api/continue-watching', continueWatchingRoute);
app.use('/api/external', externalRoute);
app.use('/api/events', eventsRoute);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'internal_error' });
});

export default app;
