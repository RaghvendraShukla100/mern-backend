import express from "express";
import upload from "../middlewares/uploadMiddleware.js";
import {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  deleteUserProfile,
  toggleFollow, // ✅ Correct import
  getFollowers,
  getFollowing,
  getUserWithPosts,
} from "../controllers/userController.js";

import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

// PUBLIC ROUTES
router.post("/register", upload.single("profilePic"), registerUser);
router.post("/login", loginUser);

// AUTHENTICATED USER PROFILE ROUTES
router
  .route("/me")
  .get(protect, getUserProfile)
  .put(protect, upload.single("profilePic"), updateUserProfile)
  .delete(protect, deleteUserProfile);

// GET USER WITH POSTS (aggregation pipeline)
router.get("/:id", protect, getUserWithPosts);

// SOCIAL FEATURES
router.put("/:id/follow", protect, toggleFollow);

router.get("/:id/followers", protect, getFollowers);
router.get("/:id/following", protect, getFollowing);

export default router;
