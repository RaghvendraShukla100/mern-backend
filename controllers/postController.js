import Post from "../models/postSchema.js";
import Notification from "../models/notificationSchema.js";
import User from "../models/userSchema.js";
import mongoose from "mongoose";

/**
 * @desc    Create a post with multiple media files & notify followers
 * @route   POST /api/posts
 * @access  Private
 */
export const createPost = async (req, res) => {
  try {
    const { caption, tags } = req.body;

    if (!req.files || req.files.length === 0) {
      return res
        .status(400)
        .json({ message: "At least one media file is required" });
    }

    const media = req.files.map((file) => ({
      url: file.path,
      type: file.mimetype.startsWith("video") ? "video" : "image",
    }));

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

    const user = await User.findById(req.user._id).select("followers");

    if (user && user.followers.length > 0) {
      const notifications = user.followers.map((followerId) => ({
        user: followerId,
        type: "post",
        from: req.user._id,
        post: post._id,
        message: `${req.user.name || "Someone"} posted a new update`,
      }));

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
 * @desc    Get paginated posts only (clean, scalable)
 * @route   GET /api/posts?page=1
 * @access  Private
 */
export const getPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;
    const userId = req.user._id;

    // ✅ Fetch requesting user's following list once
    const user = await User.findById(userId).select("following");
    const followingList = user.following.map((id) => id.toString());

    const posts = await Post.aggregate([
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },

      // Lookup user details
      {
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          as: "createdBy",
        },
      },
      { $unwind: "$createdBy" },

      // ✅ Add isFollowingCreator field based on the fetched following list
      {
        $addFields: {
          isFollowingCreator: {
            $in: [{ $toString: "$createdBy._id" }, followingList],
          },
        },
      },

      // Lookup likes
      {
        $lookup: {
          from: "likes",
          localField: "_id",
          foreignField: "post",
          as: "likes",
        },
      },
      {
        $addFields: {
          likeCount: { $size: "$likes" },
          isLikedByUser: { $in: [userId, "$likes.user"] },
        },
      },

      // Lookup comments
      {
        $lookup: {
          from: "comments",
          localField: "_id",
          foreignField: "post",
          as: "comments",
        },
      },
      {
        $addFields: {
          commentCount: { $size: "$comments" },
          isCommentedByUser: { $in: [userId, "$comments.createdBy"] },
        },
      },

      // Lookup saves
      {
        $lookup: {
          from: "saves",
          localField: "_id",
          foreignField: "post",
          as: "saves",
        },
      },
      {
        $addFields: {
          saveCount: { $size: "$saves" },
          isSavedByUser: { $in: [userId, "$saves.user"] },
        },
      },

      {
        $project: {
          likes: 0,
          comments: 0,
          saves: 0,
          "createdBy.password": 0,
        },
      },
    ]);

    res.json(posts);
  } catch (err) {
    console.error("💥 Error in getPosts:", err);
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
 * @desc    Update caption, tags, or replace media
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

// get reels with enhanced creator and user interaction data
export const getReels = async (req, res) => {
  try {
    const userId = req.user._id; // ensure protect middleware adds req.user
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    // Get user's following list and saved reels list
    const user = await User.findById(userId).select(
      "following savedPosts likedPosts"
    );
    const followedUserIds = user.following || [];
    const savedPostIds = user.savedPosts?.map((id) => id.toString()) || [];
    const likedPostIds = user.likedPosts?.map((id) => id.toString()) || [];

    // Aggregation pipeline
    const reels = await Post.aggregate([
      { $match: { "media.type": "video", isArchived: false } },
      {
        $addFields: {
          isFollowed: { $in: ["$createdBy", followedUserIds] },
          isSaved: { $in: [{ $toString: "$_id" }, savedPostIds] },
          isLiked: { $in: [{ $toString: "$_id" }, likedPostIds] },
        },
      },
      { $sort: { isFollowed: -1, createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          as: "creator",
        },
      },
      { $unwind: "$creator" },
      {
        $project: {
          caption: 1,
          media: 1,
          createdAt: 1,
          tags: 1,
          creatorId: "$creator._id",
          creatorName: "$creator.name",
          creatorUsername: "$creator.username",
          creatorProfilePic: "$creator.profilePic",
          isFollowedByCurrentUser: "$isFollowed",
          isSavedByCurrentUser: "$isSaved",
          isLikedByCurrentUser: "$isLiked",
        },
      },
    ]);

    res.status(200).json({
      success: true,
      count: reels.length,
      reels,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch reels",
    });
  }
};
