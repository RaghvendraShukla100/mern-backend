import mongoose from "mongoose";

const storySchema = new mongoose.Schema(
  {
    image: { type: String }, // Can be image or video
    video: { type: String }, // Optional: video file if it’s a reel snippet
    caption: { type: String, default: "" },
    music: { type: String, default: "" }, // Music track name or URL if you store music
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    viewers: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User", default: [] },
    ],
  },
  { timestamps: true, expireAfterSeconds: 86400 }
);

export default mongoose.model("Story", storySchema);
