import userRouter from "./routes/userRouter";
import express from 'express';
import bodyParser from 'body-parser';
import nodemailer from 'nodemailer';
import dotenv from "dotenv";
import postRouter from "./routes/postRouter";
import errorHandler from "./middleware/errorHandler";
dotenv.config();

const PORT = process.env.PORT || 3000

const app = express();
app.use(bodyParser.json());

app.use('/api/v1/user', userRouter);
app.use('/api/v1/post', postRouter);

export const transporter = nodemailer.createTransport({
  service: "gmail",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL,
    pass: process.env.APP_PASSWORD,
  },
});

app.use((req, res, next) => {
  return res.status(404).json({message: "Not Found"});
});

app.use(errorHandler)

app.listen(PORT);