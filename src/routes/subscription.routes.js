import {Router} from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import{
    subscribtionToggle,
    getSubscribedChannels,
    isSubscribed,
    getChannelSubscribers,
} from "../controllers/subscription.controller.js";

const router = Router();

router.route("/toggle/:channelId").post(
    verifyJwt,
    subscribtionToggle
)

router.route("/subscribedChannels").get(
    verifyJwt,
    getSubscribedChannels 
)
router.route("/isSubscribed/:channelId").get(
    verifyJwt,
    isSubscribed 
)
router.route("/subscribers/:channelId").get(
    verifyJwt,
    getChannelSubscribers 
)

export default router;
