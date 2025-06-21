import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  likePost,
  unlikePost,
  getPostLikes,
} from "../controllers/likeController.js";

const router = express.Router();

router.post("/:postId", protect, likePost);
router.delete("/:postId", protect, unlikePost);
router.get("/:postId/count", protect, getPostLikes);

export default router;
