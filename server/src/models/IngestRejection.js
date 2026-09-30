import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    source: { type: String, required: true },
    sourceId: { type: String, required: true },
    title: { type: String, default: '' },
    reason: { type: String, required: true },
    detail: { type: String, default: null },
  },
  { timestamps: true, versionKey: false }
);

schema.index({ createdAt: -1 });

export default mongoose.models.IngestRejection || mongoose.model('IngestRejection', schema);
