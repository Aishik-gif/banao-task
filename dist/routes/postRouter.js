"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
const auth_1 = __importDefault(require("../middleware/auth"));
const uuid_1 = require("uuid");
const postRouter = express_1.default.Router();
//can be connected to a database using prisma/mongoose/other orm
const posts = [];
postRouter.use("*", auth_1.default);
const newPostInput = zod_1.z.object({
    caption: zod_1.z.string(),
    content: zod_1.z.string(),
});
postRouter.post("/", auth_1.default, (req, res) => {
    var _a, _b;
    const body = req.body;
    const result = newPostInput.safeParse(body);
    if (!result.success)
        return res.status(400).json({ message: result.error });
    const newPost = {
        id: (0, uuid_1.v4)(),
        caption: (_a = result.data) === null || _a === void 0 ? void 0 : _a.caption,
        content: (_b = result.data) === null || _b === void 0 ? void 0 : _b.content,
        author: res.locals.user.username,
        createdAt: new Date().toISOString(),
        likes: [],
        comments: [],
    };
    posts.push(newPost); //create operation on prisma
    return res.status(201).json({ message: "Post created", post: newPost });
});
postRouter.get("/", auth_1.default, (req, res) => {
    //fetch all posts from database
    return res.json({ message: "All posts", posts });
});
postRouter.get("/:id", auth_1.default, (req, res) => {
    const postId = req.params.id;
    const post = posts.find((post) => post.id === postId); //fetch and find from database
    if (!post)
        return res
            .status(404)
            .json({ message: `No post found with the id ${postId}` });
    return res.json({ message: "Post found", post });
});
const updatePostInput = zod_1.z
    .object({
    caption: zod_1.z.string().optional(),
    content: zod_1.z.string().optional(),
})
    .refine((data) => data.caption || data.content, {
    message: "Either caption or content must be provided",
});
postRouter.put("/:id", auth_1.default, (req, res) => {
    const postId = req.params.id;
    const body = req.body;
    const result = updatePostInput.safeParse(body);
    if (!result.success)
        return res.status(400).json({ message: result.error });
    const post = posts.find((post) => post.id === postId); //fetch and find
    if (!post)
        return res
            .status(404)
            .json({ message: `No post found with the id ${postId}` });
    if (result.data.caption)
        post.caption = result.data.caption;
    if (result.data.content)
        post.content = result.data.content;
    return res.json({ message: "Post Updated", post });
});
postRouter.delete("/:id", auth_1.default, (req, res) => {
    const postId = req.params.id;
    const index = posts.findIndex((post) => post.id === postId); //fetch and find
    if (index === -1)
        return res
            .status(404)
            .json({ message: `No post found with the id ${postId}` });
    posts.splice(index, 1); //delete operation in prisma
    return res.json({ message: "Post deleted successfully" });
});
postRouter.post("/:id/like", auth_1.default, (req, res) => {
    const postId = req.params.id;
    const post = posts.find((post) => post.id === postId); //fetch and find
    if (!post)
        return res
            .status(404)
            .json({ message: `No post found with the id ${postId}` });
    const userIndex = post.likes.findIndex((userId) => userId === res.locals.user.id);
    if (userIndex === -1) {
        post.likes.push(res.locals.user.username);
        return res.json({ message: "Post liked", post: post });
    }
    else {
        post.likes.splice(userIndex, 1);
        return res.json({ message: "Post unliked", post: post });
    }
});
const addCommentInput = zod_1.z.object({
    content: zod_1.z.string(),
});
postRouter.post("/:id/comment", auth_1.default, (req, res) => {
    const postId = req.params.id;
    const body = req.body;
    const result = addCommentInput.safeParse(body);
    if (!result.success)
        return res.status(400).json({ message: result.error });
    const post = posts.find((post) => post.id === postId);
    if (!post)
        return res
            .status(404)
            .json({ message: `No post found with the id ${postId}` });
    const newComment = {
        id: (0, uuid_1.v4)(),
        content: result.data.content,
        username: res.locals.user.username,
        createdAt: new Date().toISOString(),
    };
    post.comments.push(newComment);
    return res.json({
        message: "Comment created successfully",
        comments: post.comments,
    });
});
postRouter.get("/:id/comments", auth_1.default, (req, res) => {
    const postId = req.params.id;
    const post = posts.find((post) => post.id === postId);
    if (!post)
        return res
            .status(404)
            .json({ message: `No post found with the id ${postId}` });
    return res.json({ message: "Post found", comments: post.comments });
});
postRouter.delete("/:id/comment/:commentId", auth_1.default, (req, res) => {
    const postId = req.params.id;
    const commentId = req.params.commentId;
    const post = posts.find((post) => post.id === postId);
    if (!post)
        return res
            .status(404)
            .json({ message: `No post found with the id ${postId}` });
    const commentIndex = post.comments.findIndex((comment) => comment.id === commentId);
    if (commentIndex === -1)
        return res
            .status(404)
            .json({ message: `No comment found with the id ${commentId}` });
    post.comments.splice(commentIndex, 1);
    return res.json({ message: "Comment deleted" });
});
exports.default = postRouter;
