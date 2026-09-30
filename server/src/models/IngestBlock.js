import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    source: { type: String, required: true },
    sourceId: { type: String, required: true },
    reason: { type: String, default: null },
  },
  { timestamps: true, versionKey: false }
);

schema.index({ source: 1, sourceId: 1 }, { unique: true });

export default mongoose.models.IngestBlock || mongoose.model('IngestBlock', schema);
