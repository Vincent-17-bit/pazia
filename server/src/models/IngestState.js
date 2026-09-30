import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    jobName: { type: String, required: true, unique: true },
    cursor: { type: mongoose.Schema.Types.Mixed, default: {} },
    quotaDate: { type: String, default: null },
    quotaUsed: { type: Number, default: 0 },
    lastRunAt: { type: Date, default: null },
    lastSummary: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true, versionKey: false }
);

export default mongoose.models.IngestState || mongoose.model('IngestState', schema);
