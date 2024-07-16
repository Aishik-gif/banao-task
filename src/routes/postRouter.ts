import express from "express";
import { z } from "zod";
import authMiddleware from "../middleware/auth";
import { User } from "./userRouter";
import {v4 as uuidv4} from 'uuid';

const postRouter = express.Router();

interface Comment {
  id: string;
  content: string;
  username: string;
  createdAt: string;
}

interface Post {
  id: string;
  caption: string;
  content: string;
  author: string;
  createdAt: string;
  likes: User["id"][];
  comments: Comment[];
}

const posts: Post[] = [];

postRouter.use("*", authMiddleware);

const newPostInput = z.object({
  caption: z.string(),
  content: z.string(),
});

postRouter.post("/", authMiddleware, (req, res) => {
  const body = req.body;
  const result = newPostInput.safeParse(body);
  if (!result.success) return res.status(400).json({ message: result.error });
  const newPost: Post = {
    id: uuidv4(),
    caption: result.data?.caption,
    content: result.data?.content,
    author: res.locals.user.username,
    createdAt: new Date().toISOString(),
    likes: [],
    comments: [],
  };
  posts.push(newPost);
  return res.status(201).json({ message: "Post created", post: newPost });
});

postRouter.get("/", authMiddleware, (req, res) => {
  return res.json({ message: "All posts", posts });
});

postRouter.get("/:id", authMiddleware, (req, res) => {
  const postId = req.params.id;
  const post = posts.find((post) => post.id === postId);
  if (!post)
    return res
      .status(404)
      .json({ message: `No post found with the id ${postId}` });
  return res.json({ message: "Post found", post });
});

const updatePostInput = z
  .object({
    caption: z.string().optional(),
    content: z.string().optional(),
  })
  .refine((data) => data.caption || data.content, {
    message: "Either caption or content must be provided",
  });

postRouter.put("/:id", authMiddleware, (req, res) => {
  const postId = req.params.id;
  const body = req.body;
  const result = updatePostInput.safeParse(body);
  if (!result.success) return res.status(400).json({ message: result.error });
  const post = posts.find((post) => post.id === postId);
  if (!post)
    return res
      .status(404)
      .json({ message: `No post found with the id ${postId}` });
  if (result.data.caption) post.caption = result.data.caption;
  if (result.data.content) post.content = result.data.content;
  return res.json({ message: "Post Updated", post });
});

postRouter.delete("/:id", authMiddleware, (req, res) => {
  const postId = req.params.id;
  const index = posts.findIndex((post) => post.id === postId);
  if (index === -1)
    return res
      .status(404)
      .json({ message: `No post found with the id ${postId}` });
  posts.splice(index, 1);
  return res.json({ message: "Post deleted successfully" });
});

postRouter.post("/:id/like", authMiddleware, (req, res) => {
  const postId = req.params.id;
  const post = posts.find((post) => post.id === postId);
  if (!post)
    return res
      .status(404)
      .json({ message: `No post found with the id ${postId}` });
  const userIndex = post.likes.findIndex(
    (userId) => userId === res.locals.user.id
  );
  if (userIndex === -1) {
    post.likes.push(res.locals.user.username);
    return res.json({ message: "Post liked", post: post });
  } else {
    post.likes.splice(userIndex, 1);
    return res.json({ message: "Post unliked", post: post });
  }
});

const addCommentInput = z.object({
  content: z.string(),
});

postRouter.post("/:id/comment", authMiddleware, (req, res) => {
  const postId = req.params.id;
  const body = req.body;
  const result = addCommentInput.safeParse(body);
  if(!result.success) return res.status(400).json({ message: result.error });
  const post = posts.find((post) => post.id === postId);
  if (!post)
    return res
      .status(404)
      .json({ message: `No post found with the id ${postId}` });
  const newComment: Comment = {
    id: uuidv4(),
    content: result.data.content,
    username: res.locals.user.username,
    createdAt: new Date().toISOString(),
  }
  post.comments.push(newComment);
  return res.json({message: "Comment created successfully", comments: post.comments})
});

postRouter.get("/:id/comments", authMiddleware, (req, res) => {
  const postId = req.params.id;
  const post = posts.find((post) => post.id === postId);
  if (!post)
    return res
      .status(404)
      .json({ message: `No post found with the id ${postId}` });
  return res.json({message: "Post found", comments: post.comments})
});

postRouter.delete("/:id/comment/:commentId", authMiddleware, (req, res) => {
  const postId = req.params.id;
  const commentId = req.params.commentId;
  const post = posts.find((post) => post.id === postId);
  if (!post)
    return res
      .status(404)
      .json({ message: `No post found with the id ${postId}` });
  const commentIndex = post.comments.findIndex(
    (comment) => comment.id === commentId
  );
  if (commentIndex === -1)
    return res
      .status(404)
      .json({ message: `No comment found with the id ${commentId}` });
  post.comments.splice(commentIndex, 1);
  return res.json({message: "Comment deleted"})
});

export default postRouter;
