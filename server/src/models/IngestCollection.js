import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    collection: { type: String, required: true },
    subjectFilter: { type: String, default: null },
    category: {
      type: String,
      enum: ['film', 'classic_tv', 'documentary', 'animation', 'war', 'africa_swahili'],
      required: true,
    },
    active: { type: Boolean, default: true },
    note: { type: String, default: null },
  },
  { timestamps: true, versionKey: false, suppressReservedKeysWarning: true }
);

export default mongoose.models.IngestCollection || mongoose.model('IngestCollection', schema);
