import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
    {
        recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
        sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        type: {
            type: String,
            enum: ["like", "reply", "follow", "message"],
            required: true,
        },
        post: { type: mongoose.Schema.Types.ObjectId, ref: "Post", default: null },
        read: { type: Boolean, default: false },
        message: { type: String, default: "" },
    },
    { timestamps: true }
);

notificationSchema.index({ recipient: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
