import express from "express";
import { getConversations, getMessages, sendMessage, deleteMessage } from "../controllers/messageController.js";
import protectRoute from "../middlewares/protectRoute.js";

const router = express.Router();
router.get("/conversations", protectRoute, getConversations);
router.get("/:otherUserId", protectRoute, getMessages);
router.post("/", protectRoute, sendMessage);
router.delete("/:id", protectRoute, deleteMessage);

export default router;
