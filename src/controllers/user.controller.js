import { User } from "../models/user.model.js";
import { APIError } from "../utils/APIerror.js";
import { APIresponse } from "../utils/APIresponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const AccessAndRefreshTokens = async (userID) => {
  const user = await User.findById(userID);
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();
  await User.findByIdAndUpdate(user._id, { refreshToken }, { new: true });
  return { accessToken, refreshToken };
};
const registerUser = asyncHandler(async (req, res) => {
  const { email, password, username } = req.body;
  if (!email || !password || !username) {
    throw new APIError(400, "Email, password and username are required");
  }
  const user_exists = await User.findOne({
    $or: [{ email }, { username }],
  });
  if (user_exists) {
    throw new APIError(400, "User with this email or username already exists");
  }
  const user = await User.create({
    email,
    password,
    username,
  });
  if (!user) {
    throw new APIError(
      500,
      "Failed to create user due to some internal error, try again",
    );
  }
  const { accessToken, refreshToken } = await AccessAndRefreshTokens(user._id);
  return res.status(201).json(
    new APIresponse(201, "User registered successfully", {
      user,
      accessToken,
      refreshToken,
    }),
  );
});
const login = asyncHandler(async (req, res) => {
  const { email, password, username } = req.body;
  if (!(email || username) || !password) {
    throw new APIError(400, "Email/username and password are required");
  }
  const user_exists = await User.findOne({
    $or: [{ email }, { username }],
  });
  if (!user_exists) {
    throw new APIError(404, "User with this email or username does not exist");
  }
  const PasswordMatch = await user_exists.checkPassword(password);
  if (!PasswordMatch) {
    throw new APIError(401, "Invalid password");
  }
  const { accessToken, refreshToken } = await AccessAndRefreshTokens(
    user_exists._id,
  );
  return res.status(200).json(
    new APIresponse(200, "user logged in successfully", {
      accessToken,
      refreshToken,
    }),
  );
});
const choose_role = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!role) {
    throw new APIError(
      401,
      "you need to specify whether you are a passenger or a driver",
    );
  }
  const user = await User.findById(req.user._id);
  user.role = role;
  await user.save();

  return res
    .status(200)
    .json(new APIresponse(200, `you are now registered as: ${role} `));
});

export { registerUser, login, choose_role };
