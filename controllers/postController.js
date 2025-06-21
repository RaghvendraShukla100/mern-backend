import Post from "../models/postSchema.js";
import Notification from "../models/notificationSchema.js";
import User from "../models/userSchema.js"; // Needed to get followers
import mongoose from "mongoose";

/**
 * @desc    Create a post with multiple media files & notify followers
 * @route   POST /api/posts
 * @access  Private
 */
export const createPost = async (req, res) => {
  try {
    const { caption, tags } = req.body;

    // Validate media presence
    if (!req.files || req.files.length === 0) {
      return res
        .status(400)
        .json({ message: "At least one media file is required" });
    }

    // Format media files
    const media = req.files.map((file) => ({
      url: file.path,
      type: file.mimetype.startsWith("video") ? "video" : "image",
    }));

    // Create the post
    const post = await Post.create({
      caption,
      media,
      createdBy: req.user._id,
      tags: tags
        ? Array.isArray(tags)
          ? tags
          : tags.split(",").map((tag) => tag.trim().toLowerCase())
        : [],
    });

    // Fetch followers of the user
    const user = await User.findById(req.user._id).select("followers");

    if (user && user.followers.length > 0) {
      // Generate notifications for followers
      const notifications = user.followers.map((followerId) => ({
        user: followerId, // Notification recipient
        type: "post", // Type of notification
        from: req.user._id, // Who created the post
        post: post._id, // The new post ID
        message: `${req.user.name || "Someone"} posted a new update`,
      }));

      // Insert notifications in bulk
      await Notification.insertMany(notifications);
    }

    res.status(201).json({
      message: "Post created and followers notified",
      post,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

/**
 * @desc    Get all posts (feed)
 * @route   GET /api/posts
 * @access  Private
 */
export const getPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("createdBy", "name username profilePic")
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

/**
 * @desc    Like a post
 * @route   PUT /api/posts/:id/like
 * @access  Private
 */
export const likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (post.likes.includes(req.user._id)) {
      return res.status(400).json({ message: "Already liked" });
    }

    post.likes.push(req.user._id);
    await post.save();

    res.json({ message: "Post liked" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

/**
 * @desc    Unlike a post
 * @route   PUT /api/posts/:id/unlike
 * @access  Private
 */
export const unlikePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    post.likes = post.likes.filter(
      (id) => id.toString() !== req.user._id.toString()
    );
    await post.save();

    res.json({ message: "Post unliked" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

/**
 * @desc    Delete post
 * @route   DELETE /api/posts/:id
 * @access  Private
 */
export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (post.createdBy.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this post" });
    }

    await post.deleteOne();
    res.json({ message: "Post deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

/**
 * @desc    Update caption, tags or replace media
 * @route   PUT /api/posts/:id
 * @access  Private
 */
export const updatePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (post.createdBy.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this post" });
    }

    if (req.body.caption) post.caption = req.body.caption;

    if (req.body.tags) {
      post.tags = Array.isArray(req.body.tags)
        ? req.body.tags
        : req.body.tags.split(",").map((tag) => tag.trim().toLowerCase());
    }

    if (req.files && req.files.length > 0) {
      post.media = req.files.map((file) => ({
        url: file.path,
        type: file.mimetype.startsWith("video") ? "video" : "image",
      }));
    }

    const updated = await post.save();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
