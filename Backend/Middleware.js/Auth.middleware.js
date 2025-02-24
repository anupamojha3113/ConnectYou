import jwt from "jsonwebtoken";
import { asyncHandler } from "../Utils/asyncHandler.js";
import { ApiError } from "../Utils/ApiError.js";
import  redisClient  from "../Utils/redisClient.js"; // Make sure this path matches your project structure

export const verifyJWT = asyncHandler(async (req, res, next) => {
    const token = req.headers['authorization']?.split(" ")[1];
    
    if (token === undefined) {
        return res.json(new ApiError(205, "Access Error"));
    }

    try {
        // Check if token is in the blocklist
        const isBlocked = await redisClient.get(`bl_${token}`);
        
        if (isBlocked) {
            return res.json(new ApiError(401, "Token has been revoked", "Access Error"));
        }

        // Verify the token
        const decode = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET); // Updated to match your login method
        
        req.body._id = decode._id;
        req.body.Username = decode.Username;
        
        return next();
    }
    catch (error) {
        return res.json(new ApiError(205, "Invalid Token", "Access Error"));
    }
});