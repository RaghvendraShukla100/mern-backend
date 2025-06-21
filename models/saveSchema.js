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

// Ensure a user can't save the same post twice
saveSchema.index({ user: 1, post: 1 }, { unique: true });

export default mongoose.model("Save", saveSchema);
