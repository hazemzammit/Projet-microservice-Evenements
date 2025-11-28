const Joi = require("joi");

const namePattern = /^[A-Za-zÀ-ÖØ-öø-ÿ '-]+$/;
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

const baseOptions = {
  abortEarly: false,
  stripUnknown: true
};

const nameRule = Joi.string()
  .trim()
  .min(2)
  .max(50)
  .pattern(namePattern)
  .messages({
    "string.pattern.base": "Only letters, spaces, apostrophes and hyphens are allowed",
    "string.empty": "Value cannot be empty"
  });

const passwordRule = Joi.string()
  .min(8)
  .max(72)
  .pattern(passwordPattern)
  .messages({
    "string.pattern.base": "Password must have upper, lower, number and special character",
    "string.min": "Password must be at least 8 characters long"
  });

const passwordLoginRule = Joi.string()
  .min(8)
  .max(72)
  .messages({ "string.min": "Password must be at least 8 characters long" });

const registerSchema = Joi.object({
  firstName: nameRule.required(),
  lastName: nameRule.required(),
  email: Joi.string().lowercase().email().required(),
  password: passwordRule.required(),
  role: Joi.string().valid("user", "admin").optional()
});

const createUserSchema = registerSchema.keys({
  role: Joi.string().valid("user", "admin").optional()
});

const loginSchema = Joi.object({
  email: Joi.string().lowercase().email().required(),
  password: passwordLoginRule.required()
});

const resetRequestSchema = Joi.object({
  email: Joi.string().lowercase().email().required()
});

const resetConfirmSchema = Joi.object({
  token: Joi.string().optional(),
  newPassword: passwordRule.required()
});

const changePasswordSchema = Joi.object({
  oldPassword: Joi.string().required(),
  newPassword: passwordRule.required()
});

const validateBody = (schema) => (req, res, next) => {
  const source = req.body || {};
  const { error, value } = schema.validate(source, baseOptions);
  if (error) {
    const details = error.details.map((detail) => detail.message);
    return res.status(400).json({
      success: false,
      message: "Validation error",
      details
    });
  }
  req.validatedBody = value;
  next();
};

module.exports = {
  validateBody,
  registerSchema,
  loginSchema,
  resetRequestSchema,
  resetConfirmSchema,
  changePasswordSchema,
  createUserSchema
};

