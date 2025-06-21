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

    // 💡 Add debug logs
    console.log("🔹 User:", req.user);
    console.log("🔹 PostId:", postId);

    const post = await Post.findById(postId).populate("createdBy", "name");
    if (!post) {
      console.log("❌ Post not found:", postId);
      return res.status(404).json({ message: "Post not found" });
    }

    console.log("✅ Post found:", post._id);

    const existingLike = await Like.findOne({
      user: req.user._id,
      post: postId,
    });
    console.log("🔹 Existing like:", existingLike);

    if (existingLike) {
      return res.status(400).json({ message: "Post already liked" });
    }

    const like = await Like.create({
      user: req.user._id,
      post: postId,
    });
    console.log("✅ Like created:", like);

    if (post.createdBy._id.toString() !== req.user._id.toString()) {
      try {
        await Notification.create({
          user: post.createdBy._id,
          from: req.user._id,
          type: "like",
          post: postId,
          message: `${req.user.name || "Someone"} liked your post`,
        });
        console.log("🔔 Notification created");
      } catch (err) {
        console.error("❌ Failed to create notification:", err);
      }
    }

    res.status(201).json({
      message: "Post liked and notification sent",
      like,
    });
  } catch (err) {
    console.error("💥 Error in likePost:", err);
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

    // Remove the like if exists
    const like = await Like.findOneAndDelete({
      user: req.user._id,
      post: postId,
    });

    if (!like) {
      return res.status(404).json({ message: "Like not found" });
    }

    res.json({ message: "Post unliked" });
  } catch (err) {
    console.error("💥 Error in unlikePost:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

/**
 * @desc    Get like count for a post
 * @route   GET /api/likes/:postId
 * @access  Private (or Public as per app policy)
 */
export const getPostLikes = async (req, res) => {
  try {
    const { postId } = req.params;

    // Count likes for the post
    const count = await Like.countDocuments({ post: postId });

    res.json({
      postId,
      likes: count,
    });
  } catch (err) {
    console.error("💥 Error in getPostLikes:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
