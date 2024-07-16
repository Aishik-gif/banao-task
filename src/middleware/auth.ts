import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { JwtPayload, users } from "../routes/userRouter";
dotenv.config();

const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(403).json({ message: "Unauthorized" });
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer")
    return res.status(403).json({ message: "Invalid Authorization Header" });
  const token = parts[1];
  try {
    if (!process.env.JWT_SECRET)
      return res.status(500).json({ message: "Internal server error" });
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;
    if (!decoded) return res.status(403).json({ message: "Unauthorized" });

    const user = users.find(user => user.id === decoded.id);
    if (!user) return res.status(401).json({ message: "User not found" });
    res.locals.user = user;
  } catch (err) {
    return res.status(403).json({ message: "Unauthorized" });
  }
  next();
};

export default authMiddleware;
