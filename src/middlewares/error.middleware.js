import { ApiError } from "../utils/ApiError.js"

const notFoundHandler = (req, res, next) => {
    next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`))
}

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            statusCode: err.statusCode,
            message: err.message,
            success: false,
            errors: err.errors,
            data: null,
        })
    }

    // Mongoose bad ObjectId / validation errors -> 400 instead of 500
    if (err?.name === "CastError") {
        return res.status(400).json({
            statusCode: 400,
            message: `Invalid value for field "${err.path}"`,
            success: false,
            errors: [],
            data: null,
        })
    }

    if (err?.name === "ValidationError") {
        const errors = Object.values(err.errors || {}).map((e) => e.message)
        return res.status(400).json({
            statusCode: 400,
            message: errors[0] || "Validation failed",
            success: false,
            errors,
            data: null,
        })
    }

    // Malformed JSON body from express.json()
    if (err?.type === "entity.parse.failed") {
        return res.status(400).json({
            statusCode: 400,
            message: "Invalid JSON payload",
            success: false,
            errors: [],
            data: null,
        })
    }

    const statusCode = err?.statusCode || 500
    return res.status(statusCode).json({
        statusCode,
        message: err?.message || "Internal server error",
        success: false,
        errors: [],
        data: null,
    })
}

export { errorHandler, notFoundHandler }
