import Comment from "../models/commentSchema.js";
import Post from "../models/postSchema.js";
import Notification from "../models/notificationSchema.js";
import mongoose from "mongoose";

// @desc    Create a comment on a post
// @route   POST /api/comments/post/:postId
// @access  Private
export const createComment = async (req, res) => {
  try {
    const { text, parentComment } = req.body;
    const { postId } = req.params;

    if (!text?.trim()) {
      return res.status(400).json({ message: "Comment text is required" });
    }

    const post = await Post.findById(postId).select("createdBy");
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const comment = await Comment.create({
      text,
      createdBy: req.user._id,
      post: postId,
      postCreator: post.createdBy,
      parentComment: parentComment || null,
    });

    await Post.findByIdAndUpdate(postId, { $inc: { commentCount: 1 } });

    if (post.createdBy.toString() !== req.user._id.toString()) {
      await Notification.create({
        user: post.createdBy,
        type: "comment",
        from: req.user._id,
        post: postId,
        comment: comment._id,
        message: `${req.user.name || "Someone"} commented on your post`,
      });
    }

    res.status(201).json({
      message: "Comment created successfully",
      comment,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// @desc    Delete a comment
// @route   DELETE /api/comments/:commentId
// @access  Private
export const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (comment.createdBy.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this comment" });
    }

    await comment.deleteOne();
    await Post.findByIdAndUpdate(comment.post, { $inc: { commentCount: -1 } });

    res.json({ message: "Comment deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// @desc    Update a comment
// @route   PUT /api/comments/:commentId
// @access  Private
export const updateComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { text } = req.body;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (comment.createdBy.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this comment" });
    }

    if (text?.trim()) {
      comment.text = text;
    }

    const updatedComment = await comment.save();
    res.json({
      message: "Comment updated successfully",
      comment: updatedComment,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// @desc    Get paginated comments for a specific post
// @route   GET /api/comments/post/:postId?page=1&limit=10
// @access  Public
export const getCommentsForPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ message: "Invalid postId" });
    }

    const comments = await Comment.find({ post: postId })
      .populate("createdBy", "username profilePic isVerified")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalComments = await Comment.countDocuments({ post: postId });

    const cleanedComments = comments.map((comment) => {
      if (comment.createdBy && comment.createdBy.profilePic) {
        comment.createdBy.profilePic = comment.createdBy.profilePic.replace(
          /\\/g,
          "/"
        );
      }
      return comment;
    });

    res.status(200).json({
      comments: cleanedComments,
      totalComments,
      currentPage: page,
      totalPages: Math.ceil(totalComments / limit),
      hasMore: skip + comments.length < totalComments,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
