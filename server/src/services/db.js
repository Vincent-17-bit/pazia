import mongoose from 'mongoose';

export let dbReady = false;

export async function connectDb() {
  if (!process.env.MONGODB_URI) {
    console.warn('[startup] MONGODB_URI missing — using in-memory store (data resets on restart)');
    return false;
  }
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    dbReady = true;
    console.log('[startup] MongoDB connected');
    return true;
  } catch (err) {
    console.error('[startup] MongoDB connection failed, falling back to in-memory store', err.message);
    return false;
  }
}
