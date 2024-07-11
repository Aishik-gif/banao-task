import userRouter from "./routes/userRouter";

import express from 'express';
import bodyParser from 'body-parser';
import nodemailer from 'nodemailer';
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(bodyParser.json());

app.use('/api/v1/user', userRouter);

export const transporter = nodemailer.createTransport({
  service: "gmail",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL,
    pass: process.env.APP_PASSWORD,
  },
});

app.listen(process.env.PORT ?? 3000);