import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  createComment,
  deleteComment,
  updateComment,
} from "../controllers/commentController.js";

const router = express.Router();

// POST /api/comments/:postId -> create comment on a post
router.post("/:postId", protect, createComment);

// PUT /api/comments/:id -> update comment
router.put("/:id", protect, updateComment);

// DELETE /api/comments/:id -> delete comment
router.delete("/:id", protect, deleteComment);

export default router;
