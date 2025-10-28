import { JWT_SECRET } from "../configs/env.config.js";
import pool from "../configs/db.config.js";
import APIError from "../utils/APIError.util.js";
import asyncHandler from "../utils/asyncHandler.util.js";
import jwt from "jsonwebtoken";

export const verifyAccessToken = asyncHandler(async (req, res, next) => {

    const authHeader = req.headers['authorization'] || req.headers['Authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new APIError(401, "No token provided or invalid format");
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
        throw new APIError(401, "Token is missing");
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.user_id;

        const userResult = await pool.query(
            'SELECT id, name, email, role, email_verified, banned FROM "user" WHERE id = $1',
            [userId]
        );

        if (userResult.rows.length === 0) {
            throw new APIError(404, "User not found");
        }

        const user = userResult.rows[0];

        if (user.banned) {
            throw new APIError(403, "Your account has been banned");
        }

        req.user = user;

        next();

    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            throw new APIError(401, "Invalid token");
        }
        if (error.name === 'TokenExpiredError') {
            throw new APIError(401, "Token has expired");
        }
        throw error;
    }
});

export const verifiedAccountPath = asyncHandler(async (req, res, next) => {
    
    if (!req.user) {
        throw new APIError(401, "Unauthorized - Please login first");
    }

    if (!req.user.email_verified) {
        throw new APIError(403, "Please verify your email address before accessing this resource");
    }

    next();
});

