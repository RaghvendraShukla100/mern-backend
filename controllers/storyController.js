import Story from "../models/storySchema.js";
import User from "../models/userSchema.js";
import Notification from "../models/notificationSchema.js";

// @desc    Create a story and notify followers
// @route   POST /api/stories
// @access  Private
export const createStory = async (req, res) => {
  try {
    const { caption } = req.body;
    const image = req.files?.image ? req.files.image[0].path : null;
    const video = req.files?.video ? req.files.video[0].path : null;
    const music = req.files?.music ? req.files.music[0].path : null;

    // Ensure at least image or video is provided
    if (!image && !video) {
      return res.status(400).json({ message: "Image or video is required" });
    }

    // Create the story
    const story = await Story.create({
      image,
      video,
      music,
      caption: caption || "",
      createdBy: req.user._id,
    });

    // Fetch user's followers
    const user = await User.findById(req.user._id).select("followers");

    // Create notifications for each follower
    if (user.followers.length > 0) {
      const notifications = user.followers.map((followerId) => ({
        user: followerId,
        type: "story",
        from: req.user._id,
        story: story._id,
      }));
      await Notification.insertMany(notifications);
    }

    res
      .status(201)
      .json({ message: "Story created and followers notified", story });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// @desc    Get all active stories (latest first)
// @route   GET /api/stories
// @access  Private
export const getStories = async (req, res) => {
  try {
    const stories = await Story.find()
      .populate("createdBy", "name username profilePic")
      .sort({ createdAt: -1 });

    res.json(stories);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// @desc    Mark a story as viewed by the user
// @route   PUT /api/stories/:id/view
// @access  Private
export const viewStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);

    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }

    // Add viewer if not already viewed
    if (!story.viewers.includes(req.user._id)) {
      story.viewers.push(req.user._id);
      await story.save();
    }

    res.json({ message: "Story viewed" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// @desc    Delete user's own story
// @route   DELETE /api/stories/:id
// @access  Private
export const deleteStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);

    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }

    // Ensure only owner can delete
    if (story.createdBy.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this story" });
    }

    await story.deleteOne();
    res.json({ message: "Story deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
