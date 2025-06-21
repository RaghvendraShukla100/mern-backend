import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },

    // Post creator (for notification / convenience)
    postCreator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // For threaded comments (optional replies)
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    },
  },
  { timestamps: true }
);

// 🔹 Index for faster post comment retrieval, newest first
commentSchema.index({ post: 1, createdAt: -1 });

export default mongoose.model("Comment", commentSchema);
