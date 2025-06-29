import mongoose from "mongoose";

const storySchema = new mongoose.Schema(
  {
    image: { type: String },
    video: { type: String },
    caption: { type: String, default: "" },
    music: { type: String, default: "" },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    viewers: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User", default: [] },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 86400, // TTL for auto-deletion
    },
  },
  { timestamps: { updatedAt: true } } // manual override
);

// Optional indexes
storySchema.index({ createdBy: 1 });
storySchema.index({ viewers: 1 });

export default mongoose.model("Story", storySchema);
