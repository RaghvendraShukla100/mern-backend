import Save from "../models/saveSchema.js";
import Post from "../models/postSchema.js";
import Notification from "../models/notificationSchema.js";

// @desc Save a post
// @route POST /api/saves/:postId
// @access Private

export const savePost = async (req, res) => {
  try {
    const { postId } = req.params;

    // Find post + creator
    const post = await Post.findById(postId).populate("createdBy", "_id");

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check if already saved
    const existing = await Save.findOne({
      user: req.user._id,
      post: postId,
    });

    if (existing) {
      return res.status(400).json({ message: "Post already saved" });
    }

    // Save post
    const save = await Save.create({
      user: req.user._id,
      post: postId,
    });

    // Create notification if not self-save
    if (post.createdBy._id.toString() !== req.user._id.toString()) {
      await Notification.create({
        user: post.createdBy._id,
        type: "save",
        from: req.user._id,
        post: postId,
      });
    }

    res.status(201).json({ message: "Post saved", save });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// @desc Unsave a post
// @route DELETE /api/saves/:postId
// @access Private
export const unsavePost = async (req, res) => {
  try {
    const { postId } = req.params;

    const save = await Save.findOneAndDelete({
      user: req.user._id,
      post: postId,
    });

    if (!save) {
      return res.status(404).json({ message: "Save not found" });
    }

    res.json({ message: "Post unsaved" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// @desc Get all saved posts by user
// @route GET /api/saves
// @access Private
export const getSavedPosts = async (req, res) => {
  try {
    const saves = await Save.find({ user: req.user._id }).populate({
      path: "post",
      populate: { path: "createdBy", select: "name username profilePic" },
    });

    res.json(saves);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
