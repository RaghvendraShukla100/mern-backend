import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: { type: String, default: "" },
    fileUrl: { type: String, default: "" }, // for images/audio/video/pdf
    chatId: { type: String, required: true },
  },
  { timestamps: true }
);

// 🔹 Efficient chat retrieval
messageSchema.index({ chatId: 1, createdAt: -1 });

// 🔹 Optional: user-based analytics
messageSchema.index({ sender: 1 });
messageSchema.index({ receiver: 1 });

export default mongoose.model("Message", messageSchema);
