import Like from "../models/likeSchema.js";
import Post from "../models/postSchema.js";
import Notification from "../models/notificationSchema.js";

/**
 * @desc    Like a post and notify post creator if applicable
 * @route   POST /api/likes/:postId
 * @access  Private
 */
export const likePost = async (req, res) => {
  try {
    const { postId } = req.params;

    // Check if the post exists
    const post = await Post.findById(postId).populate("createdBy", "name");
    if (!post) return res.status(404).json({ message: "Post not found" });

    // Prevent duplicate likes
    const existingLike = await Like.findOne({
      user: req.user._id,
      post: postId,
    });
    if (existingLike) {
      return res.status(400).json({ message: "Post already liked" });
    }

    // Create the like
    const like = await Like.create({ user: req.user._id, post: postId });

    // Create notification if liker is not post creator
    if (post.createdBy._id.toString() !== req.user._id.toString()) {
      await Notification.create({
        user: post.createdBy._id, // Recipient of notification
        type: "like", // Notification type
        from: req.user._id, // User who liked
        post: postId, // The post liked
        message: `${req.user.name || "Someone"} liked your post`,
      });
    }

    res.status(201).json({ message: "Post liked and notification sent", like });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

/**
 * @desc    Unlike a post
 * @route   DELETE /api/likes/:postId
 * @access  Private
 */
export const unlikePost = async (req, res) => {
  try {
    const { postId } = req.params;

    // Find and delete the like
    const like = await Like.findOneAndDelete({
      user: req.user._id,
      post: postId,
    });

    if (!like) {
      return res.status(404).json({ message: "Like not found" });
    }

    res.json({ message: "Post unliked" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

/**
 * @desc    Get like count for a post
 * @route   GET /api/likes/:postId
 * @access  Private (or Public depending on your app policy)
 */
export const getPostLikes = async (req, res) => {
  try {
    const { postId } = req.params;

    // Count number of likes for the post
    const count = await Like.countDocuments({ post: postId });

    res.json({ postId, likes: count });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
