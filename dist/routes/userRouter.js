"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.users = void 0;
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const __1 = require("..");
const dotenv_1 = __importDefault(require("dotenv"));
const uuid_1 = require("uuid");
dotenv_1.default.config();
const userRouter = express_1.default.Router();
const signupInput = zod_1.z.object({
    username: zod_1.z.string().min(4),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
});
const userSchema = signupInput.extend({
    id: zod_1.z.string(),
});
const signinInput = zod_1.z.object({
    username: zod_1.z.string().min(4),
    password: zod_1.z.string().min(6),
});
//replace with a database
exports.users = [];
userRouter.post("/signup", (req, res) => {
    try {
        const body = req.body;
        const result = signupInput.safeParse(body);
        if (!result.success)
            return res.status(400).json({ message: result.error });
        const existingUser = exports.users.find((user) => user.email === result.data.email ||
            user.username === result.data.username);
        if (existingUser)
            return res.status(409).json({ message: "User already exists" });
        const newUser = Object.assign({ id: (0, uuid_1.v4)() }, result.data);
        exports.users.push(newUser);
        if (!process.env.JWT_SECRET)
            return res.status(500).json({ message: "Can't authenticate" });
        const jwtPayload = { id: newUser.id };
        const token = jsonwebtoken_1.default.sign(jwtPayload, process.env.JWT_SECRET);
        return res.status(201).json({ message: "User created", jwt: token });
    }
    catch (error) {
        return res.status(500).json({ message: "Internal server error", error });
    }
});
userRouter.post("/signin", (req, res) => {
    try {
        const body = req.body;
        const result = signinInput.safeParse(body);
        if (!result.success)
            return res.status(400).json({ message: result.error });
        const user = exports.users.find((user) => user.username === result.data.username &&
            user.password === result.data.password);
        if (!user)
            return res.status(401).json({ message: "Invalid username or password" });
        if (!process.env.JWT_SECRET)
            return res.status(500).json({ message: "Can't authenticate" });
        const jwtPayload = { id: user.id };
        const token = jsonwebtoken_1.default.sign(jwtPayload, process.env.JWT_SECRET);
        return res.json({ message: "User logged in", jwt: token });
    }
    catch (error) {
        return res.status(500).json({ message: "Internal server error", error });
    }
});
const forgotPasswordInput = zod_1.z.object({
    email: zod_1.z.string().email(),
});
userRouter.post("/forgot-password", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const body = req.body;
        const result = forgotPasswordInput.safeParse(body);
        if (!result.success)
            return res.status(400).json({ message: result.error });
        const user = exports.users.find((user) => user.email === result.data.email);
        if (!user)
            return res.status(401).json({ message: "Invalid email" });
        const resetPassword = Math.random().toString(36).slice(2);
        user.password = resetPassword;
        if (!process.env.EMAIL)
            return res.status(500).json({ message: "error sending email" });
        const mailOptions = {
            from: {
                name: "Aishik Dutta",
                address: process.env.EMAIL,
            },
            to: `${user.email}`,
            subject: "Forgot password. Your new password",
            text: `Here is your new password`,
            html: `<h1>Here is your new password. Please login and change it!</h1>
      <h3>username: ${user.username}</h3>
      <h4>password: ${user.password}</h4>
      <p>If you didn't make this request please contact our support!</p>
      `,
        };
        __1.transporter.sendMail(mailOptions, (error, info) => {
            if (error)
                return res
                    .status(500)
                    .json({ message: "Internal server error", error });
            return res.json({ message: "Mail sent", response: info.response });
        });
    }
    catch (error) {
        return res.status(500).json({ message: "Internal server error", error });
    }
}));
exports.default = userRouter;
