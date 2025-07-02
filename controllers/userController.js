import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import crypto from "crypto";
import mongoose from "mongoose"; // ✅ REQUIRED for aggregation pipelines
import User from "../models/userSchema.js";
import Post from "../models/postSchema.js";
import Like from "../models/likeSchema.js";
import Save from "../models/saveSchema.js";
import Comment from "../models/commentSchema.js";
import Notification from "../models/notificationSchema.js";

dotenv.config();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

// Generate random token
const generateRandomToken = () => {
  return crypto.randomBytes(20).toString("hex");
};

// REGISTER USER
export const registerUser = async (req, res) => {
  const { name, username, email, mobile, age, password, bio, isPrivate } =
    req.body;
  const profilePic = req.file ? req.file.path : "";

  try {
    const existing = await User.findOne({
      $or: [{ email }, { username }, { mobile }],
    });
    if (existing) {
      return res
        .status(400)
        .json({ message: "Email, username, or mobile already registered" });
    }

    const user = await User.create({
      name,
      username,
      email,
      mobile,
      age,
      bio,
      profilePic,
      password,
      isPrivate: isPrivate || false,
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      mobile: user.mobile,
      age: user.age,
      bio: user.bio,
      profilePic: user.profilePic,
      isPrivate: user.isPrivate,
      token: generateToken(user._id),
    });
  } catch (err) {
    res.status(500).json({
      message: "Server error during registration",
      error: err.message,
    });
  }
};

// LOGIN USER
export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid email" });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: "Invalid password" });

    res.json({
      _id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      profilePic: user.profilePic,
      isPrivate: user.isPrivate,
      token: generateToken(user._id),
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Server error during login", error: err.message });
  }
};

// GET CURRENT USER PROFILE ALONG WITH HIS POSTS AND LIKE/COMMENT COUNTS and SECONDDEGERYUSERS
export const getUserProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    // 1️⃣ Fetch current user profile excluding password
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 2️⃣ Fetch all posts created by the user (newest first)
    const userPosts = await Post.find({ createdBy: userId })
      .populate("createdBy", "username name profilePic")
      .populate("media")
      .sort({ createdAt: -1 })
      .lean();

    const postsWithCounts = await Promise.all(
      userPosts.map(async (post) => {
        const likeCount = await Like.countDocuments({ post: post._id });
        const commentCount = await Comment.countDocuments({ post: post._id });
        return {
          ...post,
          likeCount,
          commentCount,
        };
      })
    );

    // 3️⃣ Fetch all saved posts by the user (full post data)
    const savedDocs = await Save.find({ userId }).lean();
    const savedPostIds = savedDocs.map((doc) => doc.postId);

    const savedPostsRaw = await Post.find({ _id: { $in: savedPostIds } })
      .populate("createdBy", "username name profilePic")
      .populate("media")
      .sort({ createdAt: -1 })
      .lean();

    const savedPostsWithCounts = await Promise.all(
      savedPostsRaw.map(async (post) => {
        const likeCount = await Like.countDocuments({ post: post._id });
        const commentCount = await Comment.countDocuments({ post: post._id });
        return {
          ...post,
          likeCount,
          commentCount,
        };
      })
    );

    // 4️⃣ Fetch second-degree users
    const firstDegreeUserIds = user.following.map((id) => id.toString());

    const firstDegreeUsers = await User.find(
      { _id: { $in: firstDegreeUserIds } },
      { following: 1 }
    ).lean();

    const secondDegreeUserIdsSet = new Set();
    firstDegreeUsers.forEach((fdUser) => {
      fdUser.following.forEach((followedId) => {
        secondDegreeUserIdsSet.add(followedId.toString());
      });
    });

    firstDegreeUserIds.forEach((id) => secondDegreeUserIdsSet.delete(id));
    secondDegreeUserIdsSet.delete(userId.toString());

    const secondDegreeUserIds = Array.from(secondDegreeUserIdsSet);

    const secondDegreeUsers = await User.find(
      { _id: { $in: secondDegreeUserIds } },
      "username name profilePic"
    ).lean();

    // 5️⃣ Return the structured response
    res.json({
      user,
      userPosts: postsWithCounts,
      savedPosts: savedPostsWithCounts,
      secondDegreeUsers,
    });
  } catch (err) {
    console.error("Error fetching user profile with posts and counts:", err);
    res.status(500).json({
      message: "Server error fetching profile",
      error: err.message,
    });
  }
};

// UPDATE PROFILE
export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.name = req.body.name || user.name;
    user.username = req.body.username || user.username;
    user.mobile = req.body.mobile || user.mobile;
    user.age = req.body.age || user.age;
    user.bio = req.body.bio || user.bio;
    user.isPrivate =
      req.body.isPrivate !== undefined ? req.body.isPrivate : user.isPrivate;

    if (req.file) user.profilePic = req.file.path;
    if (req.body.password) user.password = req.body.password;

    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      mobile: user.mobile,
      age: user.age,
      bio: user.bio,
      profilePic: user.profilePic,
      isPrivate: user.isPrivate,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Server error updating profile", error: err.message });
  }
};

// DELETE ACCOUNT
export const deleteUserProfile = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user._id);
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Server error deleting user", error: err.message });
  }
};

// TOGGLE FOLLOW / UNFOLLOW USER
export const toggleFollow = async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user._id);

    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (targetUser._id.equals(currentUser._id)) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }

    const isFollowing = currentUser.following.includes(targetUser._id);

    if (isFollowing) {
      // ✅ Unfollow
      currentUser.following = currentUser.following.filter(
        (id) => !id.equals(targetUser._id)
      );
      targetUser.followers = targetUser.followers.filter(
        (id) => !id.equals(currentUser._id)
      );

      await currentUser.save();
      await targetUser.save();

      return res.json({ message: "Unfollowed user", isFollowing: false });
    } else {
      // ✅ Check private before follow
      if (targetUser.isPrivate) {
        return res.status(403).json({
          message: "Follow request required for private account",
        });
      }

      // ✅ Follow
      currentUser.following.push(targetUser._id);
      targetUser.followers.push(currentUser._id);

      await currentUser.save();
      await targetUser.save();

      await Notification.create({
        user: targetUser._id,
        type: "follow",
        from: currentUser._id,
        message: `${currentUser.name} started following you`,
      });

      return res.json({ message: "Followed user", isFollowing: true });
    }
  } catch (err) {
    console.error("Error in toggleFollow:", err);
    res.status(500).json({
      message: "Server error toggling follow status",
      error: err.message,
    });
  }
};

// GET FOLLOWERS
export const getFollowers = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate(
      "followers",
      "name username profilePic"
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user.followers);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Server error fetching followers", error: err.message });
  }
};

// GET FOLLOWING
export const getFollowing = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate(
      "following",
      "name username profilePic"
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user.following);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Server error fetching following", error: err.message });
  }
};

// GET USER WITH POSTS USING AGGREGATION
export const getUserWithPosts = async (req, res) => {
  try {
    const userId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const requestingUserId = req.user._id; // ✅ requesting user's _id for check

    const userWithPosts = await User.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(userId) } },
      {
        $lookup: {
          from: "posts",
          localField: "_id",
          foreignField: "createdBy",
          as: "posts",
        },
      },
      {
        $addFields: {
          followersCount: { $size: "$followers" },
          followingCount: { $size: "$following" },
          postsCount: { $size: "$posts" },
          isFollowing: {
            $in: [new mongoose.Types.ObjectId(requestingUserId), "$followers"],
          },
        },
      },
      {
        $project: {
          password: 0,
          __v: 0,
          "posts.__v": 0,
          "posts.updatedAt": 0,
          "posts.comments": 0,
        },
      },
    ]);

    if (!userWithPosts || userWithPosts.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(userWithPosts[0]);
  } catch (error) {
    console.error("Error fetching user with posts:", error);
    res.status(500).json({
      message: "Server error fetching user with posts",
      error: error.message,
    });
  }
};
