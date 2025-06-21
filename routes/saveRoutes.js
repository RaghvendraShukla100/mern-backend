import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  savePost,
  unsavePost,
  getSavedPosts,
} from "../controllers/saveController.js";

const router = express.Router();

router.post("/:postId", protect, savePost);
router.delete("/:postId", protect, unsavePost);
router.get("/", protect, getSavedPosts);

export default router;
