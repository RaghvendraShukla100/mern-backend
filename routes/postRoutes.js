import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { protect } from "../middlewares/authMiddleware.js";
import {
  createPost,
  getPosts,
  likePost,
  unlikePost,
  deletePost,
  updatePost,
} from "../controllers/postController.js";

const router = express.Router();

// Multer config
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
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB per file
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

// Routes
router.post("/", protect, upload.array("media", 10), createPost);
router.get("/", protect, getPosts);
router.put("/:id/like", protect, likePost);
router.put("/:id/unlike", protect, unlikePost);
router.delete("/:id", protect, deletePost);
router.put("/:id", protect, upload.array("media", 10), updatePost);

export default router;
