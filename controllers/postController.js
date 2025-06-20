import Post from "../models/postSchema.js";
import Comment from "../models/commentSchema.js"; // Assuming you'll create this
import mongoose from "mongoose";

// @desc Create a post
// @route POST /api/posts
// @access Private
export const createPost = async (req, res) => {
  try {
    const { caption, tags } = req.body;
    const image = req.file ? req.file.path : null;

    if (!image) {
      return res.status(400).json({ message: "Image is required" });
    }

    const post = await Post.create({
      caption,
      image,
      createdBy: req.user._id,
      tags,
    });

    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// @desc Get all posts (feed)
// @route GET /api/posts
// @access Private
export const getPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("createdBy", "name username profilePic")
      .populate({
        path: "comments",
        populate: { path: "commentedBy", select: "name username" },
      })
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// @desc Like a post
// @route PUT /api/posts/:id/like
// @access Private
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

// @desc Unlike a post
// @route PUT /api/posts/:id/unlike
// @access Private
export const unlikePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) return res.status(404).json({ message: "Post not found" });

    post.likes = post.likes.filter(
      (userId) => userId.toString() !== req.user._id.toString()
    );

    await post.save();

    res.json({ message: "Post unliked" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// @desc Delete post
// @route DELETE /api/posts/:id
// @access Private
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

// @desc Update post (caption or tags)
// @route PUT /api/posts/:id
// @access Private
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
        : req.body.tags.split(",").map((tag) => tag.trim());
    }

    if (req.file) {
      post.image = req.file.path;
    }

    const updated = await post.save();

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
