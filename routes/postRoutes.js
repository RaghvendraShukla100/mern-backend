import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import {
  createPost,
  getPosts,
  likePost,
  unlikePost,
  deletePost,
  updatePost,
} from "../controllers/postController.js";

const router = express.Router();

// Setup multer for file upload
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

const upload = multer({ storage });

// Routes
router
  .route("/")
  .post(protect, upload.single("image"), createPost)
  .get(protect, getPosts);

router
  .route("/:id")
  .put(protect, upload.single("image"), updatePost) // Now handles form-data + image
  .delete(protect, deletePost);

router.put("/:id/like", protect, likePost);
router.put("/:id/unlike", protect, unlikePost);

export default router;
