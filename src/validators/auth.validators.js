const { z } = require('zod');

/**
 * Signup validation schema
 */
const signupSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters long')
    .max(100, 'Name must be at most 100 characters long')
    .trim(),
  email: z
    .string()
    .email('Invalid email format')
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .min(1, 'Password cannot be empty'),
});

/**
 * Validate signup request data
 * @param {object} data - Request body data
 * @returns {object} Validated and transformed data
 * @throws {Error} If validation fails
 */
const validateSignup = (data) => {
  try {
    const validated = signupSchema.parse(data);
    return {
      isValid: true,
      data: validated,
      errors: null,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return {
        isValid: false,
        data: null,
        errors,
      };
    }
    throw error;
  }
};

/**
 * Login validation schema
 */
const loginSchema = z.object({
  email: z
    .string()
    .email('Invalid email format')
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(1, 'Password cannot be empty'),
});

/**
 * Validate login request data
 * @param {object} data - Request body data
 * @returns {object} Validated and transformed data
 * @throws {Error} If validation fails
 */
const validateLogin = (data) => {
  try {
    const validated = loginSchema.parse(data);
    return {
      isValid: true,
      data: validated,
      errors: null,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return {
        isValid: false,
        data: null,
        errors,
      };
    }
    throw error;
  }
};

module.exports = {
  signupSchema,
  validateSignup,
  loginSchema,
  validateLogin,
};

