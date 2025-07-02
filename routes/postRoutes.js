import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { protect } from "../middlewares/authMiddleware.js";
import {
  createPost,
  getPosts,
  getReels,
  deletePost,
  updatePost,
} from "../controllers/postController.js";

const router = express.Router();

/**
 * ⚡ Multer configuration for post media uploads
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/posts";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `post-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max per file
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype.startsWith("image") ||
      file.mimetype.startsWith("video")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only images and videos are allowed"));
    }
  },
});

/**
 * 🛠️ Routes
 */

// Create a post with media
router.post("/", protect, upload.array("media", 10), createPost);

// Get paginated posts
// Supports: /api/posts?page=1
router.get("/", protect, getPosts);

// get paginated reels
//  /api/post/reels
router.get("/reels", protect, getReels);

// Delete a post
router.delete("/:id", protect, deletePost);

// Update a post (caption/tags/media replacement)
router.put("/:id", protect, upload.array("media", 10), updatePost);

export default router;
