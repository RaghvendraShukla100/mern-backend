import mongoose from "mongoose";

const likeSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    post: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true },
  },
  { timestamps: true }
);

// Prevent duplicate likes
likeSchema.index({ user: 1, post: 1 }, { unique: true });

// Optimize for aggregation lookup on posts
likeSchema.index({ post: 1 });

export default mongoose.model("Like", likeSchema);
