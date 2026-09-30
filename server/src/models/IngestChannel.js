import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    handle: { type: String, default: null },
    channelId: { type: String, default: null },
    label: { type: String, required: true },
    categories: [{ type: String }],
    isKids: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
    verified: { type: Boolean, default: false },
    lastIngestedAt: { type: Date, default: null },
    note: { type: String, default: null },
  },
  { timestamps: true, versionKey: false }
);

schema.index({ channelId: 1 }, { unique: true, sparse: true });

export default mongoose.models.IngestChannel || mongoose.model('IngestChannel', schema);
