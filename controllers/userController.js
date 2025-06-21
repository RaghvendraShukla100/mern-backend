import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import crypto from "crypto";
import User from "../models/userSchema.js";
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
        .json({ message: "Email, username or mobile already registered" });
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
    res.status(500).json({ message: "Server error", error: err.message });
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
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// GET PROFILE
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
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
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// DELETE ACCOUNT
export const deleteUserProfile = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user._id);
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// FOLLOW USER
export const followUser = async (req, res) => {
  try {
    const userToFollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user._id);

    if (!userToFollow)
      return res.status(404).json({ message: "User not found" });

    if (userToFollow._id.equals(currentUser._id))
      return res.status(400).json({ message: "You cannot follow yourself" });

    if (currentUser.following.includes(userToFollow._id))
      return res.status(400).json({ message: "Already following" });

    if (userToFollow.isPrivate) {
      // For private accounts, you'd implement a follow request system (optional)
      return res
        .status(403)
        .json({ message: "Follow request required for private account" });
    }

    currentUser.following.push(userToFollow._id);
    userToFollow.followers.push(currentUser._id);

    await currentUser.save();
    await userToFollow.save();
    await Notification.create({
      user: userToFollow._id,
      type: "follow",
      from: currentUser._id,
      message: `${currentUser.name} started following you`,
    });

    res.json({ message: "Followed user and notification sent" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// UNFOLLOW USER
export const unfollowUser = async (req, res) => {
  try {
    const userToUnfollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user._id);

    if (!userToUnfollow)
      return res.status(404).json({ message: "User not found" });

    currentUser.following = currentUser.following.filter(
      (id) => !id.equals(userToUnfollow._id)
    );
    userToUnfollow.followers = userToUnfollow.followers.filter(
      (id) => !id.equals(currentUser._id)
    );

    await currentUser.save();
    await userToUnfollow.save();

    res.json({ message: "Unfollowed user" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
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
    res.status(500).json({ message: "Server error", error: err.message });
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
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
