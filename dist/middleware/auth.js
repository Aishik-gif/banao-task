"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
const userRouter_1 = require("../routes/userRouter");
dotenv_1.default.config();
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader)
        return res.status(403).json({ message: "Unauthorized" });
    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer")
        return res.status(403).json({ message: "Invalid Authorization Header" });
    const token = parts[1];
    try {
        if (!process.env.JWT_SECRET)
            return res.status(500).json({ message: "Internal server error" });
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        if (!decoded)
            return res.status(403).json({ message: "Unauthorized" });
        const user = userRouter_1.users.find((user) => user.id === decoded.id);
        if (!user)
            return res.status(401).json({ message: "User not found" });
        res.locals.user = user;
    }
    catch (err) {
        return res.status(403).json({ message: "Unauthorized" });
    }
    next();
};
exports.default = authMiddleware;
