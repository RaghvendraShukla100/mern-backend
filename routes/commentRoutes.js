import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  createComment,
  deleteComment,
  updateComment,
  getCommentsForPost,
} from "../controllers/commentController.js";

const router = express.Router();

// GET /api/comments/:postId?page=1&limit=10 -> fetch paginated comments for a post
router.get("/:postId", getCommentsForPost);

// POST /api/comments/:postId -> create a comment on a post
router.post("/:postId", protect, createComment);

// PUT /api/comments/:commentId -> update a specific comment
router.put("/:commentId", protect, updateComment);

// DELETE /api/comments/:commentId -> delete a specific comment
router.delete("/:commentId", protect, deleteComment);

export default router;
