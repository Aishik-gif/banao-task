import express from "express";
import { z } from "zod";
import jwt from "jsonwebtoken";
import { transporter } from "..";
import dotenv from "dotenv";
import {v4 as uuidv4} from 'uuid';
dotenv.config();

const userRouter = express.Router();

const signupInput = z.object({
  username: z.string().min(4),
  email: z.string().email(),
  password: z.string().min(6),
});
const userSchema = signupInput.extend({
  id: z.string()
})
export type User = z.infer<typeof userSchema>;

const signinInput = z.object({
  username: z.string().min(4),
  password: z.string().min(6),
});

export interface JwtPayload{
  id: string;
}

export const users: User[] = [];

userRouter.post("/signup", (req, res) => {
  try {
    const body = req.body;
    const result = signupInput.safeParse(body);
    if (!result.success) return res.status(400).json({ message: result.error });
    const existingUser = users.find((user) => user.email === result.data.email || user.username === result.data.username);
    if (existingUser) return res.status(409).json({ message: "User already exists" });
    const newUser = {
      id: uuidv4(),
      ...result.data
    }

    users.push(newUser);

    if (!process.env.JWT_SECRET)
      return res.status(500).json({ message: "Can't authenticate" });
    const jwtPayload: JwtPayload = { id: newUser.id };
    const token = jwt.sign(
      jwtPayload,
      process.env.JWT_SECRET
    );

    return res.status(201).json({ message: "User created", jwt: token });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error });
  }
});

userRouter.post("/signin", (req, res) => {
  try {
    const body = req.body;
    const result = signinInput.safeParse(body);
    if (!result.success) return res.status(400).json({ message: result.error });
    const user = users.find(
      (user) =>
        user.username === result.data.username &&
        user.password === result.data.password
    );

    if (!user)
      return res.status(401).json({ message: "Invalid username or password" });

    if (!process.env.JWT_SECRET)
      return res.status(500).json({ message: "Can't authenticate" });
    const jwtPayload: JwtPayload = { id: user.id };
    const token = jwt.sign(jwtPayload, process.env.JWT_SECRET);
    return res.json({ message: "User logged in", jwt: token });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error });
  }
});


const forgotPasswordInput = z.object({
  email: z.string().email(),
});

userRouter.post("/forgot-password", async (req, res) => {
  try {
    const body = req.body;
    const result = forgotPasswordInput.safeParse(body);
    if (!result.success) return res.status(400).json({ message: result.error });

    const user = users.find((user) => user.email === result.data.email);
    if(!user) return res.status(401).json({message: "Invalid email"});

    const resetPassword = Math.random().toString(36).slice(2);
    user.password = resetPassword;

    if(!process.env.EMAIL) return res.status(500).json({message: "error sending email"})
    const mailOptions = {
      from: {
        name: 'Aishik Dutta',
        address: process.env.EMAIL,
      },
      to: `${user.email}`,
      subject: "Forgot password. Your new password",
      text: `Here is your new password`,
      html: 
      `<h1>Here is your new password. Please login and change it!</h1>
      <h3>username: ${user.username}</h3>
      <h4>password: ${user.password}</h4>
      <p>If you didn't make this request please contact our support!</p>
      `
    }

    transporter.sendMail(mailOptions, (error, info) => {
      if(error) 
        return res.status(500).json({ message: "Internal server error", error });
      return res.json({message: "Mail sent", response: info.response});
    });

  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error });
  }
});

export default userRouter;
