import express from "express";
import {
    createPost,
    deletePost,
    getFeedPosts,
    getPost,
    getUserPosts,
    likeUnlikePost,
    replyToPost,
    bookmarkPost,
    getBookmarkedPosts,
} from "../controllers/postController.js";
import protectRoute from "../middlewares/protectRoute.js";

const router = express.Router();
router.get("/feed", protectRoute, getFeedPosts);
router.get("/bookmarks", protectRoute, getBookmarkedPosts);
router.get("/user/:username", getUserPosts);
router.get("/:id", getPost);
router.post("/create", protectRoute, createPost);
router.delete("/:id", protectRoute, deletePost);
router.put("/like/:id", protectRoute, likeUnlikePost);
router.put("/reply/:id", protectRoute, replyToPost);
router.put("/bookmark/:id", protectRoute, bookmarkPost);

export default router;
