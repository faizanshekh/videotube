import { Router } from 'express';
import {
    addComment,
    deleteComment,
    getVideoComments,
    updateComment,
} from "../controllers/comment.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"
import {validate} from "../middlewares/validate.middleware.js"
import {commentValidator, updateCommentValidator} from "../validators/content.validators.js"

const router = Router();

router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/:videoId").get(getVideoComments).post(commentValidator, validate, addComment);
router.route("/c/:commentId").delete(deleteComment).patch(updateCommentValidator, validate, updateComment);

export default router