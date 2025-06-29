import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    type: {
      type: String,
      enum: [
        "like",
        "comment",
        "follow",
        "message",
        "mention",
        "tag",
        "story_view",
        "save",
        "post",
      ],
      required: true,
    },

    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
    },

    comment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
    },

    story: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Story",
    },

    isRead: {
      type: Boolean,
      default: false,
    },

    message: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// ✅ Recommended indexes
notificationSchema.index({ user: 1, createdAt: -1 }); // feed performance
notificationSchema.index({ user: 1, isRead: 1 }); // unread filter
notificationSchema.index({ post: 1 });
notificationSchema.index({ comment: 1 });
notificationSchema.index({ story: 1 });

export default mongoose.model("Notification", notificationSchema);
