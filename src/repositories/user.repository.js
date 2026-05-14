const User = require('../models/User.model');
const { AppError } = require('../utils');

// User Repository for database operations
class UserRepository {
  // Create a new user
  static async create(userData) {
    const user = new User(userData);
    try {
      await user.save();
      return user;
    } catch (error) {
      if (error.code === 11000) {
        const field = Object.keys(error.keyValue)[0];
        throw AppError.conflict(`User with this ${field} already exists`);
      }
      throw error;
    }
  }

  // Find user by ID
  static async findById(userId) {
    return User.findById(userId);
  }

  // Find user by email
  static async findByEmail(email) {
    return User.findOne({ email: email.toLowerCase() });
  }

  // Find user by email with password (for authentication)
  static async findByEmailWithPassword(email) {
    return User.findOne({ email: email.toLowerCase() }).select(
      '+passwordHash'
    );
  }

  // Find all users with pagination
  static async findAll(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const users = await User.find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments();

    return {
      users,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
    };
  }

  // Find users by role
  static async findByRole(role, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const users = await User.find({ role })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments({ role });

    return {
      users,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
    };
  }

  // Update user
  static async update(userId, updateData) {
    // Prevent updating sensitive fields
    const allowedFields = [
      'name',
      'role',
      'plan',
      'isActive',
      'isEmailVerified',
      'lastLoginAt',
      'profileUrl',
    ];
    const filteredData = {};

    allowedFields.forEach((field) => {
      if (field in updateData) {
        filteredData[field] = updateData[field];
      }
    });

    const user = await User.findByIdAndUpdate(userId, filteredData, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      throw AppError.notFound('User not found');
    }

    return user;
  }

  // Update password hash
  static async updatePasswordHash(userId, passwordHash) {
    const user = await User.findByIdAndUpdate(
      userId,
      { passwordHash },
      { new: true, runValidators: true }
    );

    if (!user) {
      throw AppError.notFound('User not found');
    }

    return user;
  }

  // Update last login
  static async updateLastLogin(userId) {
    return User.findByIdAndUpdate(
      userId,
      { lastLoginAt: new Date() },
      { new: true }
    );
  }

  // Delete user
  static async delete(userId) {
    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      throw AppError.notFound('User not found');
    }

    return user;
  }

  // Check if email exists
  static async emailExists(email) {
    const user = await User.findOne({ email: email.toLowerCase() });
    return !!user;
  }

  // Get user count
  static async count() {
    return User.countDocuments();
  }

  // Get active users count
  static async countActive() {
    return User.countDocuments({ isActive: true });
  }

  // Deactivate user
  static async deactivate(userId) {
    const user = await User.findByIdAndUpdate(
      userId,
      { isActive: false },
      { new: true }
    );

    if (!user) {
      throw AppError.notFound('User not found');
    }

    return user;
  }

  // Activate user
  static async activate(userId) {
    const user = await User.findByIdAndUpdate(
      userId,
      { isActive: true },
      { new: true }
    );

    if (!user) {
      throw AppError.notFound('User not found');
    }

    return user;
  }

  // Mark email as verified
  static async verifyEmail(userId) {
    const user = await User.findByIdAndUpdate(
      userId,
      { isEmailVerified: true },
      { new: true }
    );

    if (!user) {
      throw AppError.notFound('User not found');
    }

    return user;
  }
}

module.exports = UserRepository;
