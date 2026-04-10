import Conversation from "../models/conversationModel.js";
import Message from "../models/messageModel.js";
import { getRecipientSocketId, io } from "../socket/socket.js";
import { v2 as cloudinary } from "cloudinary";

async function sendMessage(req, res) {
    try {
        const { recipientId, message } = req.body;
        let { img } = req.body;
        const senderId = req.user._id;

        let conversation = await Conversation.findOne({
            participants: { $all: [senderId, recipientId] },
        });

        if (!conversation) {
            conversation = new Conversation({
                participants: [senderId, recipientId],
                lastMessage: { text: message, sender: senderId },
            });
            await conversation.save();
        }

        if (img) {
            const uploadedResponse = await cloudinary.uploader.upload(img);
            img = uploadedResponse.secure_url;
        }

        const newMessage = new Message({
            conversationId: conversation._id,
            sender: senderId,
            text: message,
            img: img || "",
        });

        await Promise.all([
            newMessage.save(),
            conversation.updateOne({ lastMessage: { text: message, sender: senderId } }),
        ]);

        const recipientSocketId = getRecipientSocketId(recipientId);
        if (recipientSocketId) {
            io.to(recipientSocketId).emit("newMessage", newMessage);
        }

        res.status(201).json(newMessage);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

async function getMessages(req, res) {
    const { otherUserId } = req.params;
    const userId = req.user._id;
    try {
        const conversation = await Conversation.findOne({
            participants: { $all: [userId, otherUserId] },
        });

        if (!conversation) {
            return res.status(404).json({ error: "Conversation not found" });
        }

        const messages = await Message.find({ conversationId: conversation._id }).sort({ createdAt: 1 });
        res.status(200).json(messages);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

async function getConversations(req, res) {
    const userId = req.user._id;
    try {
        const conversations = await Conversation.find({ participants: userId }).populate({
            path: "participants",
            select: "username profilePic",
        });

        conversations.forEach((conversation) => {
            conversation.participants = conversation.participants.filter(
                (p) => p._id.toString() !== userId.toString()
            );
        });
        res.status(200).json(conversations);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

async function deleteMessage(req, res) {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const message = await Message.findById(id);
        if (!message) return res.status(404).json({ error: "Message not found" });
        if (message.sender.toString() !== userId.toString()) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        if (message.img) {
            const imgId = message.img.split("/").pop().split(".")[0];
            await cloudinary.uploader.destroy(imgId);
        }

        await Message.findByIdAndDelete(id);

        const conversation = await Conversation.findById(message.conversationId);
        if (conversation) {
            const other = conversation.participants.find((p) => p.toString() !== userId.toString());
            const recipientSocketId = getRecipientSocketId(other?.toString());
            if (recipientSocketId) {
                io.to(recipientSocketId).emit("messageDeleted", {
                    messageId: id,
                    conversationId: message.conversationId,
                });
            }
        }

        res.status(200).json({ message: "Message deleted" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export { sendMessage, getMessages, getConversations, deleteMessage };
