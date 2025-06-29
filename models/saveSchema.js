import mongoose from "mongoose";

const saveSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    post: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate saves
saveSchema.index({ user: 1, post: 1 }, { unique: true });

// Improve aggregation and count performance
saveSchema.index({ post: 1 });

export default mongoose.model("Save", saveSchema);
