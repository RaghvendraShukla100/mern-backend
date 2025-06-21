import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { protect } from "../middlewares/authMiddleware.js";
import {
  createStory,
  getStories,
  viewStory,
  deleteStory,
} from "../controllers/storyController.js";

const router = express.Router();

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/stories";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `story-${Date.now()}${ext}`);
  },
});

// Accept image + video
const upload = multer({ storage });

// Routes
router.post(
  "/",
  protect,
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "video", maxCount: 1 },
    { name: "music", maxCount: 1 },
  ]),
  createStory
);

router.get("/", protect, getStories);
router.put("/:id/view", protect, viewStory);
router.delete("/:id", protect, deleteStory);

export default router;
