import Comment from "../models/commentSchema.js";
import Post from "../models/postSchema.js";
import Notification from "../models/notificationSchema.js";

// @desc    Create a comment
// @route   POST /api/comments/:postId
// @access  Private
export const createComment = async (req, res) => {
  try {
    const { text } = req.body;
    const { postId } = req.params;

    if (!text) {
      return res.status(400).json({ message: "Comment text is required" });
    }

    // Find the post and its creator
    const post = await Post.findById(postId).populate("createdBy", "name");
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Create the comment
    const comment = await Comment.create({
      text,
      createdBy: req.user._id,
      post: postId,
    });

    // Add comment ID to post's comments array
    post.comments.push(comment._id);
    await post.save();

    // Generate notification if commenter is not the post creator
    if (post.createdBy._id.toString() !== req.user._id.toString()) {
      await Notification.create({
        user: post.createdBy._id, // Recipient of notification
        type: "comment", // Type of action
        from: req.user._id, // Who triggered the notification
        post: postId, // Related post
        comment: comment._id, // Related comment
        message: `${req.user.name || "Someone"} commented on your post`, // Friendly message
      });
    }

    res.status(201).json({
      message: "Comment created and notification sent (if applicable)",
      comment,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// @desc    Delete a comment
// @route   DELETE /api/comments/:id
// @access  Private
export const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Only author of comment can delete
    if (comment.createdBy.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this comment" });
    }

    // Remove comment from Post's comments array
    await Post.findByIdAndUpdate(comment.post, {
      $pull: { comments: comment._id },
    });

    await comment.deleteOne();

    res.json({ message: "Comment deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// @desc    Update a comment
// @route   PUT /api/comments/:id
// @access  Private
export const updateComment = async (req, res) => {
  try {
    const { text } = req.body;
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Only author can update
    if (comment.createdBy.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this comment" });
    }

    if (text) comment.text = text;

    const updated = await comment.save();

    res.json({ message: "Comment updated", updated });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
