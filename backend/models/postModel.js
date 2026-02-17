import mongoose from "mongoose";

const replySchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        text: {
            type: String,
            required: true,
            trim: true,
            maxlength: 300,
        },
        userProfilePic: {
            type: String,
            default: "",
        },
        username: {
            type: String,
            trim: true,
        },
    },
    { timestamps: true }
);

const postSchema = new mongoose.Schema(
    {
        postedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        text: {
            type: String,
            trim: true,
            maxlength: 500,
            default: "",
        },

        img: {
            type: String,
            default: "",
        },

        likes: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],

        replies: [replySchema],
    },
    {
        timestamps: true,
    }
);

/* Prevent empty post (must contain text OR image) */
postSchema.pre("validate", function (next) {
    if (!this.text && !this.img) {
        return next(new Error("Post must contain text or image"));
    }
    next();
});

/* Virtual like count (faster than calculating on frontend) */
postSchema.virtual("likesCount").get(function () {
    return this.likes.length;
});

/* Clean response JSON */
postSchema.set("toJSON", {
    virtuals: true,
    transform: (_, ret) => {
        delete ret.__v;
        return ret;
    },
});

/* Feed optimization index */
postSchema.index({ createdAt: -1 });

const Post = mongoose.model("Post", postSchema);

export default Post;
