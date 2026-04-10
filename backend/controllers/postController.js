import Post from "../models/postModel.js";
import User from "../models/userModel.js";
import Notification from "../models/notificationModel.js";
import { v2 as cloudinary } from "cloudinary";
import { io, getRecipientSocketId } from "../socket/socket.js";

const createPost = async (req, res) => {
    try {
        const { postedBy, text } = req.body;
        let { img } = req.body;

        if (!postedBy || !text) {
            return res.status(400).json({ error: "Postedby and text fields are required" });
        }

        const user = await User.findById(postedBy);
        if (!user) return res.status(404).json({ error: "User not found" });

        if (user._id.toString() !== req.user._id.toString()) {
            return res.status(401).json({ error: "Unauthorized to create post" });
        }

        if (text.length > 500) {
            return res.status(400).json({ error: "Text must be less than 500 characters" });
        }

        if (img) {
            const uploadedResponse = await cloudinary.uploader.upload(img);
            img = uploadedResponse.secure_url;
        }

        const newPost = new Post({ postedBy, text, img });
        await newPost.save();

        res.status(201).json(newPost);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getPost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ error: "Post not found" });
        res.status(200).json(post);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const deletePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ error: "Post not found" });

        if (post.postedBy.toString() !== req.user._id.toString()) {
            return res.status(401).json({ error: "Unauthorized to delete post" });
        }

        if (post.img) {
            const imgId = post.img.split("/").pop().split(".")[0];
            await cloudinary.uploader.destroy(imgId);
        }

        await Post.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Post deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const likeUnlikePost = async (req, res) => {
    try {
        const { id: postId } = req.params;
        const userId = req.user._id;

        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ error: "Post not found" });

        const userLikedPost = post.likes.includes(userId);

        if (userLikedPost) {
            await Post.updateOne({ _id: postId }, { $pull: { likes: userId } });
            res.status(200).json({ message: "Post unliked successfully" });
        } else {
            post.likes.push(userId);
            await post.save();

            // Create notification for post owner (not self)
            if (post.postedBy.toString() !== userId.toString()) {
                const notification = new Notification({
                    recipient: post.postedBy,
                    sender: userId,
                    type: "like",
                    post: postId,
                    message: `${req.user.username} liked your post`,
                });
                await notification.save();

                // Real-time notification
                const recipientSocketId = getRecipientSocketId(post.postedBy.toString());
                if (recipientSocketId) {
                    io.to(recipientSocketId).emit("newNotification", {
                        ...notification.toObject(),
                        sender: { _id: userId, username: req.user.username, profilePic: req.user.profilePic },
                    });
                }
            }

            res.status(200).json({ message: "Post liked successfully" });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const replyToPost = async (req, res) => {
    try {
        const { text } = req.body;
        const postId = req.params.id;
        const userId = req.user._id;
        const userProfilePic = req.user.profilePic;
        const username = req.user.username;

        if (!text) return res.status(400).json({ error: "Text field is required" });

        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ error: "Post not found" });

        const reply = { userId, text, userProfilePic, username };
        post.replies.push(reply);
        await post.save();

        // Notify post owner
        if (post.postedBy.toString() !== userId.toString()) {
            const notification = new Notification({
                recipient: post.postedBy,
                sender: userId,
                type: "reply",
                post: postId,
                message: `${username} replied to your post`,
            });
            await notification.save();

            const recipientSocketId = getRecipientSocketId(post.postedBy.toString());
            if (recipientSocketId) {
                io.to(recipientSocketId).emit("newNotification", {
                    ...notification.toObject(),
                    sender: { _id: userId, username, profilePic: userProfilePic },
                });
            }
        }

        res.status(200).json(reply);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getFeedPosts = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: "User not found" });

        const feedPosts = await Post.find({ postedBy: { $in: user.following } }).sort({ createdAt: -1 });
        res.status(200).json(feedPosts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getUserPosts = async (req, res) => {
    const { username } = req.params;
    try {
        const user = await User.findOne({ username });
        if (!user) return res.status(404).json({ error: "User not found" });

        const posts = await Post.find({ postedBy: user._id }).sort({ createdAt: -1 });
        res.status(200).json(posts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Bookmark a post
const bookmarkPost = async (req, res) => {
    try {
        const userId = req.user._id;
        const postId = req.params.id;

        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ error: "Post not found" });

        const user = await User.findById(userId);
        const alreadyBookmarked = user.bookmarks.includes(postId);

        if (alreadyBookmarked) {
            await User.findByIdAndUpdate(userId, { $pull: { bookmarks: postId } });
            res.status(200).json({ message: "Bookmark removed", bookmarked: false });
        } else {
            await User.findByIdAndUpdate(userId, { $push: { bookmarks: postId } });
            res.status(200).json({ message: "Post bookmarked", bookmarked: true });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get bookmarked posts
const getBookmarkedPosts = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("bookmarks");
        const posts = await Post.find({ _id: { $in: user.bookmarks } }).sort({ createdAt: -1 });
        res.status(200).json(posts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export {
    createPost,
    getPost,
    deletePost,
    likeUnlikePost,
    replyToPost,
    getFeedPosts,
    getUserPosts,
    bookmarkPost,
    getBookmarkedPosts,
};
