import express from "express";
import upload from "../middlewares/uploadMiddleware.js";
import {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  deleteUserProfile,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  // requestPasswordReset,
  // resetPassword,
} from "../controllers/userController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

// PUBLIC ROUTES
router.post("/register", upload.single("profilePic"), registerUser);
router.post("/login", loginUser);
// router.post("/request-password-reset", requestPasswordReset);
// router.post("/reset-password", resetPassword);

// AUTHENTICATED USER PROFILE ROUTES
router
  .route("/me")
  .get(protect, getUserProfile)
  .put(protect, upload.single("profilePic"), updateUserProfile)
  .delete(protect, deleteUserProfile);

// SOCIAL FEATURES
router.put("/:id/follow", protect, followUser);
router.put("/:id/unfollow", protect, unfollowUser);
router.get("/:id/followers", protect, getFollowers);
router.get("/:id/following", protect, getFollowing);

export default router;
