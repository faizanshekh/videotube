import { body } from "express-validator"

const registerValidator = [
    body("fullName")
        .trim()
        .notEmpty()
        .withMessage("Full name is required")
        .isLength({ max: 60 })
        .withMessage("Full name must be at most 60 characters"),
    body("email")
        .trim()
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .withMessage("Email must be a valid email address")
        .normalizeEmail(),
    body("username")
        .trim()
        .notEmpty()
        .withMessage("Username is required")
        .isLength({ min: 3, max: 30 })
        .withMessage("Username must be 3-30 characters")
        .matches(/^[a-zA-Z0-9._]+$/)
        .withMessage("Username may only contain letters, numbers, dots and underscores"),
    body("password")
        .notEmpty()
        .withMessage("Password is required")
        .isLength({ min: 8 })
        .withMessage("Password must be at least 8 characters"),
]

const loginValidator = [
    body("password").notEmpty().withMessage("Password is required"),
    body().custom((value) => {
        if (!value.username && !value.email) {
            throw new Error("Username or email is required")
        }
        return true
    }),
]

const changePasswordValidator = [
    body("oldPassword").notEmpty().withMessage("Old password is required"),
    body("newPassword")
        .notEmpty()
        .withMessage("New password is required")
        .isLength({ min: 8 })
        .withMessage("New password must be at least 8 characters"),
]

const updateAccountValidator = [
    body("fullName")
        .trim()
        .notEmpty()
        .withMessage("Full name is required")
        .isLength({ max: 60 })
        .withMessage("Full name must be at most 60 characters"),
    body("email")
        .trim()
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .withMessage("Email must be a valid email address")
        .normalizeEmail(),
]

export {
    registerValidator,
    loginValidator,
    changePasswordValidator,
    updateAccountValidator,
}
