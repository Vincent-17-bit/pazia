import 'dotenv/config';
import app from './app.js';
import { loadGenresAndKeywords } from './services/genres.js';
import { connectDb } from './services/db.js';

const PORT = process.env.PORT || 4000;

async function start() {
  await connectDb();
  await loadGenresAndKeywords();
  app.listen(PORT, () => console.log(`[startup] server listening on :${PORT}`));
}

start();
