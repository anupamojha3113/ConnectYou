import { ApiError } from "../Utils/ApiError.js";
import { asyncHandler } from "../Utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { FileUpload } from "../Utils/PostUpload.js";
import ApiResponse from "../Utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import Following from "../models/Following.model.js";
import Post from "../models/Post.model.js";
import  redisClient  from "../Utils/redisClient.js";

const registerUser = asyncHandler(async (req, res) => {
  const { FullName, username, email, password } = req.body;
  if ([FullName, username, email, password].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  const isExist = await User.findOne({ $or: [{ username }, { email }] });
  if (isExist) {
    throw new ApiError(400, "User already exists");
  }

  const avatarLocalPath = req.files?.Avatar[0]?.path;

  const postString = await FileUpload(avatarLocalPath);

  const newUser = await User.create({
    FullName,
    username,
    email,
    password,
    Avatar: postString?.url || "",
  });

  const checkUser = await User.findById(newUser._id).select("-password -refreshToken");
  if (!checkUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  res.status(201).json(new ApiResponse(200, checkUser, "Registered User Successfully"));
});


const loginuser = asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) {
    throw new ApiError(400, "Unauthorized User");
  }

  const check = await user.isPasswordCorrect(password);
  if (!check) {
    throw new ApiError(400, "Incorrect Password");
  }

  // Generate Access Token (Short-Lived)
  const AccessToken = jwt.sign(
    {
      _id: user.id,
      Username: user.username,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "5m" } // 1-hour expiry
  );

  // Generate Refresh Token (Longer-Lived)
  const RefreshToken = jwt.sign(
    { _id: user.id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" } // 7-day expiry
  );

  // Set Secure HTTP-Only Cookie for Refresh Token
  res.cookie("refreshToken", RefreshToken, {
    httpOnly: true, // Prevent access via JavaScript (XSS protection)
    secure: process.env.NODE_ENV === "production", // Only HTTPS in production
    sameSite: "Strict", // Prevent CSRF attacks
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  });

  return res
    .status(200)
    .json(new ApiResponse(200, { user: user._id, Token: AccessToken }, "User Successfully Logged In"));
});


// Logout user
const logoutUser = asyncHandler(async (req, res) => {
  // Get the access token from Authorization header
  const accessToken = req.headers.authorization?.split(' ')[1];
  
  if (!accessToken) {
    throw new ApiError(400, "No access token found");
  }

  // Add the token to Redis blocklist with 5 min expiry time
  await redisClient.set(`bl_${accessToken}`, 'true', 'EX', 300); // 300 seconds = 5 minutes
  
  // Clear refresh token cookie
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict"
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

// Refresh access token
const refreshAccessToken = asyncHandler(async (req, res) => {
  // Get refresh token from cookies
  const refreshToken = req.cookies.refreshToken;
  
  if (!refreshToken) {
    throw new ApiError(401, "Refresh token not found");
  }
  
  try {
    // Verify the refresh token
    const decodedToken = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    
    // Find the user
    const user = await User.findById(decodedToken._id);
    if (!user) {
      throw new ApiError(404, "User not found");
    }
    
    // Generate new access token
    const newAccessToken = jwt.sign(
      {
        _id: user.id,
        Username: user.username,
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "5m" }
    );
    
    return res
      .status(200)
      .json(new ApiResponse(200, { Token: newAccessToken }, "Access token refreshed successfully"));
      
  } catch (error) {
    throw new ApiError(401, "Invalid or expired refresh token");
  }
});


const Makesearchwrequest = asyncHandler(async(req,res) =>{
  const {search} = req.query;
  try{
    const regexPattern = new RegExp(`^${search}`, 'i');

    // Find all users whose names match the regex pattern
    const users = await User.find({ username: regexPattern }).select("-password -email");
    return res.status(200).json(new ApiResponse(200, users, " Successfully search"));
  }
  catch{
    throw new ApiError(405, "Somethings Went Wrongs");
  }
})

const CurrentUserPassword = asyncHandler(async (req, res) => {

  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.body?._id);
    const check = await user.isPasswordCorrect(oldPassword);
    
    if (!check) {
      throw new ApiError(405, "Not Correct Password");
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: true });

    return res.status(200).json(new ApiResponse(200, {}, "Successfully changed password"));
  } catch (error) {
    // Handle errors
    return res.status(error.statusCode || 500).json({ error: error.message });
  }
});


const CurrentUser = asyncHandler(async (req, res) => {
  return res.status(200).json(new ApiResponse(200, req.user, "Get Current User"));
});

const UpdateAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.files?.Avatar[0]?.path;
  if (!avatarLocalPath) {
    throw new ApiError(405, "Avatar Missing");
  }

  const avatar = await FileUpload(avatarLocalPath);

  if (!avatar.url) {
    throw new ApiError(405, "Avatar Uploading Api Error");
  }
  const user = await User.findById(req.body?._id);
  user.Avatar = avatar.url;
  await user.save({ validateBeforeSave: true });

  return res.status(200).json(new ApiResponse(200, {}, "Avatar Change Successfully"));
});

const getProfileofUser = asyncHandler(async (req, res) => {
  const username = (req.body.username === null || req.body.username === undefined) ? req.body.Username : req.body.username;
  const cacheKey = `profile:${username}`;
  
  try {
    // Check if profile data exists in Redis cache
    const cachedProfile = await redisClient.get(cacheKey);
    
    if (cachedProfile) {
      return res.status(200).json(new ApiResponse(200, JSON.parse(cachedProfile), "Get User Profile Successfully (Cached)"));
    }
    
    // If not in cache, fetch from database
    const getProfileofUser = await User.findOne({ username });
    if (!getProfileofUser) {
      throw new ApiError(406, "Something Wrong while Getting Profile");
    }
    
    const countFollowing = await Following.countDocuments({ follows: req.body._id });
    const countFollower = await Following.countDocuments({ follower: req.body._id });
    const Posts = await Post.find({ owner: getProfileofUser._id });
    
    const getData = {
      Profiledata: getProfileofUser,
      countFollowing: countFollowing,
      countFollower: countFollower,
      Posts: Posts,
    };
    
    // Store in Redis with expiration (e.g., 1 hour = 3600 seconds)
    await redisClient.setEx(cacheKey, 3600, JSON.stringify(getData));
    
    
    return res.status(200).json(new ApiResponse(200, getData, "Get User Profile Successfully"));
  } catch (error) {
    throw new ApiError(500, error.message || "Error retrieving profile");
  }
});

const getProfileofAlt = asyncHandler(async (req, res) => {
  const { Username, _id } = req.body;
  const profileId = req.query._id._id;
  
  if (profileId == undefined) {
    throw new ApiError(405, "Not Access to get");
  }
  
  try {
    const cacheKey = `profile:alt:${profileId}:requestor:${_id}`;
    
    // Check if profile data exists in Redis cache
    const cachedProfile = await redisClient.get(cacheKey);
    
    if (cachedProfile) {
      return res.status(200).json(new ApiResponse(200, JSON.parse(cachedProfile), "Get User Profile Successfully (Cached)"));
    }
    
    const user = await User.findById(profileId);
    const countFollowing = await Following.countDocuments({ follows: profileId });
    const countFollower = await Following.countDocuments({ follower: profileId });
    
    let isyouraccount = (profileId === _id);
    let isfollowing = false;
    const find = await Following.findOne({ $and: [{ follower: _id }, { follows: profileId }] });
    
    if (find) {
      isfollowing = true;
    }
    
    const Posts = await Post.find({ owner: profileId });
    
    const getData = {
      Profiledata: user,
      isfollowing: isfollowing,
      isyouraccount: isyouraccount,
      countFollowing: countFollowing,
      countFollower: countFollower,
      Posts: Posts,
    };
    
    // Store in Redis with expiration (e.g., 30 minutes = 1800 seconds)
    await redisClient.setEx(cacheKey, 1800, JSON.stringify(getData));
    
    return res.status(200).json(new ApiResponse(200, getData, "Get User Profile Successfully"));
  } catch (error) {
    throw new ApiError(405, "Get Some Problem while Fetching the data");
  }
});

const Followrequest = asyncHandler(async (req, res) => {
  const { _id, Username } = req.body;
  const targetUserId = req.body.user_id._id;
  
  if (targetUserId == undefined) {
    throw new ApiError(402, "Something Went Wrong in Following");
  }
  
  try {
    const findfollow = await Following.findOne({ $and: [{ follows: targetUserId }, { follower: _id }] });
    
    // Update follow status
    if (!findfollow) {
      await Following.create({
        follows: targetUserId,
        follower: _id
      });
    } else {
      await Following.deleteOne({
        follows: targetUserId,
        follower: _id
      });
    }
    
    const countFollowing = await Following.countDocuments({ follows: targetUserId });
    const countFollower = await Following.countDocuments({ follower: targetUserId });
    const isFollowing = !findfollow;
    
    // Invalidate related caches
    const keysToDelete = [
      `profile:*`,
      `profile:alt:${targetUserId}:*`,
      `profile:alt:*:requestor:${_id}`
    ];
    
    for (const pattern of keysToDelete) {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    }
    
    return res.status(200).json(new ApiResponse(200, {
      followers: countFollower,
      following: countFollowing,
      isfollowing: isFollowing
    }, isFollowing ? "Successfully Follow" : "Successfully Unfollow"));
  } catch (error) {
    throw new ApiError(403, "Something Went Wrong in Following");
  }
});

const GetAllPost = asyncHandler(async (req, res) => {
  console.log("Get AllPost!!");
  try {
    console.log("Get AllPost");
    const { skip = 0, limit = 10 } = req.query;
    const skipCount = parseInt(skip);
    const limitCount = parseInt(limit);
    
    const cacheKey = `posts:skip:${skipCount}:limit:${limitCount}`;
    
    // Check if posts data exists in Redis cache
    const cachedPosts = await redisClient.get(cacheKey);
    
    if (cachedPosts) {
      console.log("Get AllPost Successfully (Cached)");
      return res.status(200).json({
        success: true,
        data: JSON.parse(cachedPosts),
        message: "Get AllPost Successfully (Cached)"
      });
    }
    
    // If not in cache, fetch from database
    const limitedPosts = await Post.find().skip(skipCount).limit(limitCount);
    const totalCount = await Post.countDocuments();
    
    const postsData = {
      posts: limitedPosts,
      totalCount: totalCount
    };
    
    // Store in Redis with expiration (e.g., 10 minutes = 600 seconds)
    await redisClient.setEx(cacheKey, 60, JSON.stringify(postsData));
    
    return res.status(200).json({
      success: true,
      data: postsData,
      message: "Get AllPost Successfully"
    });
  } catch (error) {
    console.log(error.message);
    
    return res.status(500).json({
      success: false,
      error: "Internal Server Error"
    });
  }
});


export { Makesearchwrequest ,getProfileofAlt, Followrequest,GetAllPost,
  registerUser, loginuser, CurrentUserPassword, CurrentUser, UpdateAvatar, getProfileofUser
};
