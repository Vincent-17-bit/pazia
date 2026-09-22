import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import { loadGenresAndKeywords } from './services/genres.js';
import { connectDb } from './services/db.js';
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
import historyRoute from './routes/history.js';
import continueWatchingRoute from './routes/continueWatching.js';

const app = express();
const PORT = process.env.PORT || 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

app.use(helmet());
app.use(cors({ origin: CLIENT_ORIGIN }));
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
app.use('/api/history', historyRoute);
app.use('/api/continue-watching', continueWatchingRoute);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'internal_error' });
});

async function start() {
  await connectDb();
  await loadGenresAndKeywords();
  app.listen(PORT, () => console.log(`[startup] server listening on :${PORT}`));
}

start();
