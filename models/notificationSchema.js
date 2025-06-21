import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user: {
      // The recipient of the notification
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
      // The user who triggered the notification
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    post: {
      // Related post (if any)
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
    },

    comment: {
      // Related comment (if any)
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
    },

    story: {
      // Related story (if any, e.g., story view, tag)
      type: mongoose.Schema.Types.ObjectId,
      ref: "Story",
    },

    isRead: {
      type: Boolean,
      default: false,
    },

    message: {
      // Optional custom message
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);
