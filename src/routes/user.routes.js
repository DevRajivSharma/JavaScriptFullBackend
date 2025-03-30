import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changePassword,
  changeUserName,
  getCurrentUser,
  changeUserAvatar,
  changeUserCoverImage,
  getUserChannelProfile,
}

from "../controllers/user.controller.js";
import  upload from "../middlewares/multer.middleware.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";
const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name:"avatar",
      maxCount:1
    },
    {
      name:"coverImage",
      maxCount:1
    }
  ]),
  registerUser
)

router.route("/login").post(loginUser)

router.route("/logout").post(
  verifyJwt,
  logoutUser
)

router.route("/refresh-token").get(refreshAccessToken)
router.route("/change-password").post(
  verifyJwt,
  changePassword
)
router.route("/change-username").post(
  verifyJwt,
  changeUserName
)
router.route("/getCurrentUser").post(
  verifyJwt,
  getCurrentUser
)
router.route("/change-avatar").post(
  verifyJwt,
  upload.field(
    {
      name:"avatar",
      maxCount:1
    }
  ),
  changeUserAvatar
)

router.route("/change-avatar").post(
  verifyJwt,
  upload.field(
    {
      name:"coverImage",
      maxCount:1
    }
  ),
  changeUserCoverImage
)

router.route("/getChannelData:username").get(
  verifyJwt,
  getUserChannelProfile
)

export default router;