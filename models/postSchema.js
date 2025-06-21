import mongoose from "mongoose";

const mediaSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["image", "video"],
      required: true,
    },
  },
  { _id: false }
);

const postSchema = new mongoose.Schema(
  {
    caption: {
      type: String,
      default: "",
      trim: true,
      maxlength: 2200, // Instagram-like caption limit
    },
    media: {
      type: [mediaSchema],
      validate: {
        validator: (arr) => arr.length > 0,
        message: "At least one media file (image or video) is required",
      },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    isArchived: {
      type: Boolean,
      default: false,
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Post", postSchema);
