import 'dotenv/config';
import app from '../src/app.js';
import { loadGenresAndKeywords } from '../src/services/genres.js';
import { connectDb } from '../src/services/db.js';

// module scope survives warm invocations of the same lambda, so this only
// runs once per cold start rather than on every request
let ready = null;
function init() {
  if (!ready) {
    ready = Promise.all([connectDb(), loadGenresAndKeywords()]).catch((err) => {
      console.error('[startup] init failed', err);
      ready = null; // allow retry on next invocation
      throw err;
    });
  }
  return ready;
}

export default async function handler(req, res) {
  await init();
  app(req, res);
}
