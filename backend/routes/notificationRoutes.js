import express from "express";
import protectRoute from "../middlewares/protectRoute.js";
import {
    getNotifications,
    markAllRead,
    deleteNotification,
    getUnreadCount,
} from "../controllers/notificationController.js";

const router = express.Router();

router.get("/", protectRoute, getNotifications);
router.get("/unread-count", protectRoute, getUnreadCount);
router.put("/mark-read", protectRoute, markAllRead);
router.delete("/:id", protectRoute, deleteNotification);

export default router;
