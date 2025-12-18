const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");
const authController = require("../controllers/authController");
const authenticate = require("../middlewares/auth");
const {
  validateBody,
  registerSchema,
  loginSchema,
  resetRequestSchema,
  resetConfirmSchema,
  changePasswordSchema,
  createUserSchema
} = require("../middlewares/validation");

router.post("/register", validateBody(registerSchema), authController.register);
router.post("/login", validateBody(loginSchema), authController.login);
router.get("/verify", authController.verify);

router.post(
  "/reset-password/request",
  validateBody(resetRequestSchema),
  authController.requestReset
);
router.post(
  "/reset-password/confirm",
  validateBody(resetConfirmSchema),
  authController.confirmReset
);

router.post(
  "/change-password",
  authenticate,
  validateBody(changePasswordSchema),
  authController.changePassword
);

router.get("/", userController.getUsers);
router.post("/", validateBody(createUserSchema), userController.createUser);
router.put("/:id", userController.updateUser);
router.patch("/:id", userController.updateUser);
router.delete("/:id", userController.deleteUser);

module.exports = router;
