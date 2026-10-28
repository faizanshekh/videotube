import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    const channelId = req.user?._id

    const videos = await Video.find({owner: channelId}).select("_id views")
    const videoIds = videos.map((video) => video._id)

    const [totalSubscribers, totalLikes] = await Promise.all([
        Subscription.countDocuments({channel: channelId}),
        Like.countDocuments({video: {$in: videoIds}})
    ])

    const totalVideos = videos.length
    const totalViews = videos.reduce((sum, video) => sum + (video.views || 0), 0)

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {
                totalVideos,
                totalViews,
                totalSubscribers,
                totalLikes
            },
            "Channel stats fetched successfully"
        )
    )
})

const getChannelVideos = asyncHandler(async (req, res) => {
    const videos = await Video.find({owner: req.user?._id}).sort({createdAt: -1})

    return res
    .status(200)
    .json(new ApiResponse(200, videos, "Channel videos fetched successfully"))
})

export {
    getChannelStats, 
    getChannelVideos
    }
