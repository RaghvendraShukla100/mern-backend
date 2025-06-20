import express from "express";
import upload from "../middlewares/uploadMiddleware.js";
import {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  deleteUserProfile,
} from "../controllers/userController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Public routes
router.post("/register", upload.single("profilePic"), registerUser);
router.post("/login", loginUser);

// Protected routes
router
  .route("/me")
  .get(protect, getUserProfile)
  .put(protect, upload.single("profilePic"), updateUserProfile)
  .delete(protect, deleteUserProfile);

export default router;
