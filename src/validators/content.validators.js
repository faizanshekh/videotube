import { body, param } from "express-validator"
import { isValidObjectId } from "mongoose"

const objectIdParam = (name) =>
    param(name).custom((value) => {
        if (!isValidObjectId(value)) {
            throw new Error(`Invalid ${name}`)
        }
        return true
    })

const commentValidator = [
    objectIdParam("videoId"),
    body("content")
        .trim()
        .notEmpty()
        .withMessage("Comment content is required")
        .isLength({ max: 1000 })
        .withMessage("Comment must be at most 1000 characters"),
]

const updateCommentValidator = [
    objectIdParam("commentId"),
    body("content")
        .trim()
        .notEmpty()
        .withMessage("Comment content is required")
        .isLength({ max: 1000 })
        .withMessage("Comment must be at most 1000 characters"),
]

const tweetValidator = [
    body("content")
        .trim()
        .notEmpty()
        .withMessage("Tweet content is required")
        .isLength({ max: 280 })
        .withMessage("Tweet must be at most 280 characters"),
]

const updateTweetValidator = [
    objectIdParam("tweetId"),
    body("content")
        .trim()
        .notEmpty()
        .withMessage("Tweet content is required")
        .isLength({ max: 280 })
        .withMessage("Tweet must be at most 280 characters"),
]

const playlistValidator = [
    body("name")
        .trim()
        .notEmpty()
        .withMessage("Playlist name is required")
        .isLength({ max: 60 })
        .withMessage("Playlist name must be at most 60 characters"),
    body("description")
        .trim()
        .notEmpty()
        .withMessage("Playlist description is required")
        .isLength({ max: 200 })
        .withMessage("Playlist description must be at most 200 characters"),
]

const updatePlaylistValidator = [
    objectIdParam("playlistId"),
    body().custom((value) => {
        if (!value.name?.trim() && !value.description?.trim()) {
            throw new Error("Name or description is required")
        }
        return true
    }),
    body("name")
        .optional({ values: "falsy" })
        .trim()
        .isLength({ min: 1, max: 60 })
        .withMessage("Playlist name must be 1-60 characters"),
    body("description")
        .optional({ values: "falsy" })
        .trim()
        .isLength({ min: 1, max: 200 })
        .withMessage("Playlist description must be 1-200 characters"),
]

export {
    commentValidator,
    updateCommentValidator,
    tweetValidator,
    updateTweetValidator,
    playlistValidator,
    updatePlaylistValidator,
}
