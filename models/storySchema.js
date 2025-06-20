import mongoose from "mongoose";

const storySchema = new mongoose.Schema(
  {
    image: { type: String, required: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    viewers: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User", default: [] },
    ],
  },
  { timestamps: true, expireAfterSeconds: 86400 } // 24 hrs auto delete (Mongo TTL index)
);

export default mongoose.model("Story", storySchema);
