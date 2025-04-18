import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/APiResponse.js";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";


const subscribtionToggle = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const subscriberId = req.user?._id;

  if (!channelId || !subscriberId) {
    throw new ApiError(400, "channelId or subscriberId is required");
  }

  const channel = await User.findById(channelId);

  if (!channel) {
    throw new ApiError(400, "channel or subscriber not found");
  }

  const existingSubscription = await Subscription.findOne({
    subscriber: subscriberId,
    channel: channelId, 
  })

  if (existingSubscription) {
    await Subscription.findByIdAndDelete(existingSubscription._id) 
    return res.status(200).json(
      new ApiResponse(200,"Unsubscribed successfully",{})
    )
  }

  const newSubscription = await Subscription.create({
    subscriber: subscriberId,
    channel: channelId, 
  })
  return res.status(200).json(
    new ApiResponse(200,"Subscribed successfully",newSubscription)
  )
})

const getChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!channelId) {
    throw new ApiError(400, "channelId is required");
  }
  const channel = await User.findById(channelId);

  if (!channel) {
    throw new ApiError(400, "channel not found");
  }

  const subscribers = await Subscription.find({
    channel: channelId,
  })

  if (!subscribers) {
    throw new ApiError(400, "subscribers not found"); 
  }
  return res.status(200).json(
    new ApiResponse(200,"Subscribers fetched successfully",subscribers) 
  )
})

const getSubscribedChannels = asyncHandler(async (req, res) => {
  const subscriberId = req.user?._id;

  if (!subscriberId) {
    throw new ApiError(400, "subscriberId is required");
  } 

  const subscribedChannels = await Subscription.find({
    subscriber: subscriberId,
  })

  if (!subscribedChannels) {
    throw new ApiError(400, "subscribedChannels not found");
  }

  return res.status(200).json(
    new ApiResponse(200,"Subscribed Channels fetched successfully",subscribedChannels)
  )

})

const isSubscribed = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const subscriberId = req.user?._id;

  if (!channelId ||!subscriberId) {
    throw new ApiError(400, "channelId or subscriberId is required");
  }

  const channel = await User.findById(channelId);

  if (!channel) {
    throw new ApiError(400, "channel or subscriber not found");
  }
  
  const existingSubscription = await Subscription.findOne({
    subscriber: subscriberId,
    channel: channelId,
  })

  if (existingSubscription) {
    return res.status(200).json(
      new ApiResponse(200,"Subscribed",true)
    )
  }

  return res.status(200).json(
    new ApiResponse(200,"Not Subscribed",false)  
  )
})

export {
  subscribtionToggle,
  getSubscribedChannels,
  isSubscribed,
  getChannelSubscribers,
}