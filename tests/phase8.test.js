const User = require('../src/models/User.model');
const UserRepository = require('../src/repositories/user.repository');

describe('Phase 8: User Model', () => {
  // Clean up after each test
  afterEach(async () => {
    await User.deleteMany({});
  });

  describe('User Model Structure', () => {
    test('should create a user with all required fields', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        passwordHash: 'hashed_password_123',
      };

      const user = new User(userData);
      expect(user).toHaveProperty('name', 'John Doe');
      expect(user).toHaveProperty('email', 'john@example.com');
      expect(user).toHaveProperty('passwordHash', 'hashed_password_123');
    });

    test('should have all required fields in schema', () => {
      const requiredFields = [
        'name',
        'email',
        'passwordHash',
        'role',
        'plan',
        'isActive',
        'isEmailVerified',
        'lastLoginAt',
      ];

      const schemaFields = Object.keys(User.schema.paths);
      requiredFields.forEach((field) => {
        expect(schemaFields).toContain(field);
      });
    });

    test('should have timestamps (createdAt, updatedAt)', async () => {
      const user = new User({
        name: 'Test User',
        email: 'test@example.com',
        passwordHash: 'hash123',
      });

      await user.save();

      expect(user).toHaveProperty('createdAt');
      expect(user).toHaveProperty('updatedAt');
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('Email Handling', () => {
    test('should lowercase email on save', async () => {
      const user = new User({
        name: 'Test User',
        email: 'TEST@EXAMPLE.COM',
        passwordHash: 'hash123',
      });

      await user.save();

      expect(user.email).toBe('test@example.com');
    });

    test('should validate email format', async () => {
      const user = new User({
        name: 'Test User',
        email: 'invalid-email',
        passwordHash: 'hash123',
      });

      let error;
      try {
        await user.validate();
      } catch (e) {
        error = e;
      }

      expect(error).toBeDefined();
      expect(error.errors.email.message).toContain('valid email');
    });

    test('should enforce unique email constraint', async () => {
      const user1 = new User({
        name: 'User 1',
        email: 'unique@example.com',
        passwordHash: 'hash123',
      });

      await user1.save();

      const user2 = new User({
        name: 'User 2',
        email: 'unique@example.com',
        passwordHash: 'hash456',
      });

      let error;
      try {
        await user2.save();
      } catch (e) {
        error = e;
      }

      expect(error).toBeDefined();
      expect(error.code).toBe(11000); // MongoDB duplicate key error
    });

    test('should handle case-insensitive duplicate emails', async () => {
      const user1 = new User({
        name: 'User 1',
        email: 'test@example.com',
        passwordHash: 'hash123',
      });

      await user1.save();

      const user2 = new User({
        name: 'User 2',
        email: 'TEST@EXAMPLE.COM',
        passwordHash: 'hash456',
      });

      let error;
      try {
        await user2.save();
      } catch (e) {
        error = e;
      }

      expect(error).toBeDefined();
      expect(error.code).toBe(11000);
    });
  });

  describe('Password Security', () => {
    test('should not expose passwordHash in toJSON', async () => {
      const user = new User({
        name: 'Test User',
        email: 'test@example.com',
        passwordHash: 'hashed_password_123',
      });

      await user.save();

      const jsonUser = user.toJSON();
      expect(jsonUser).not.toHaveProperty('passwordHash');
      expect(jsonUser).toHaveProperty('email');
      expect(jsonUser).toHaveProperty('name');
    });

    test('should not return passwordHash by default', async () => {
      const user = new User({
        name: 'Test User',
        email: 'test@example.com',
        passwordHash: 'hashed_password_123',
      });

      await user.save();

      const foundUser = await User.findById(user._id);
      expect(foundUser.passwordHash).toBeUndefined();
    });

    test('should allow explicit selection of passwordHash', async () => {
      const user = new User({
        name: 'Test User',
        email: 'test@example.com',
        passwordHash: 'hashed_password_123',
      });

      await user.save();

      const foundUser = await User.findById(user._id).select('+passwordHash');
      expect(foundUser.passwordHash).toBe('hashed_password_123');
    });
  });

  describe('User Fields and Defaults', () => {
    test('should have correct default values', async () => {
      const user = new User({
        name: 'Test User',
        email: 'test@example.com',
        passwordHash: 'hash123',
      });

      expect(user.role).toBe('user');
      expect(user.plan).toBe('free');
      expect(user.isActive).toBe(true);
      expect(user.isEmailVerified).toBe(false);
      expect(user.lastLoginAt).toBeNull();
    });

    test('should allow setting custom role', async () => {
      const user = new User({
        name: 'Admin User',
        email: 'admin@example.com',
        passwordHash: 'hash123',
        role: 'admin',
      });

      await user.save();

      expect(user.role).toBe('admin');
    });

    test('should validate role enum', async () => {
      const user = new User({
        name: 'Test User',
        email: 'test@example.com',
        passwordHash: 'hash123',
        role: 'invalid_role',
      });

      let error;
      try {
        await user.validate();
      } catch (e) {
        error = e;
      }

      expect(error).toBeDefined();
      expect(error.errors.role).toBeDefined();
    });

    test('should validate plan enum', async () => {
      const user = new User({
        name: 'Test User',
        email: 'test@example.com',
        passwordHash: 'hash123',
        plan: 'invalid_plan',
      });

      let error;
      try {
        await user.validate();
      } catch (e) {
        error = e;
      }

      expect(error).toBeDefined();
      expect(error.errors.plan).toBeDefined();
    });

    test('should allow pro and enterprise plans', async () => {
      const proUser = new User({
        name: 'Pro User',
        email: 'pro@example.com',
        passwordHash: 'hash123',
        plan: 'pro',
      });

      await proUser.save();
      expect(proUser.plan).toBe('pro');

      const enterpriseUser = new User({
        name: 'Enterprise User',
        email: 'enterprise@example.com',
        passwordHash: 'hash123',
        plan: 'enterprise',
      });

      await enterpriseUser.save();
      expect(enterpriseUser.plan).toBe('enterprise');
    });
  });

  describe('Field Validation', () => {
    test('should require name', async () => {
      const user = new User({
        email: 'test@example.com',
        passwordHash: 'hash123',
      });

      let error;
      try {
        await user.validate();
      } catch (e) {
        error = e;
      }

      expect(error).toBeDefined();
      expect(error.errors.name).toBeDefined();
    });

    test('should require email', async () => {
      const user = new User({
        name: 'Test User',
        passwordHash: 'hash123',
      });

      let error;
      try {
        await user.validate();
      } catch (e) {
        error = e;
      }

      expect(error).toBeDefined();
      expect(error.errors.email).toBeDefined();
    });

    test('should require passwordHash', async () => {
      const user = new User({
        name: 'Test User',
        email: 'test@example.com',
      });

      let error;
      try {
        await user.validate();
      } catch (e) {
        error = e;
      }

      expect(error).toBeDefined();
      expect(error.errors.passwordHash).toBeDefined();
    });

    test('should validate name length', async () => {
      const user = new User({
        name: 'A', // Too short
        email: 'test@example.com',
        passwordHash: 'hash123',
      });

      let error;
      try {
        await user.validate();
      } catch (e) {
        error = e;
      }

      expect(error).toBeDefined();
      expect(error.errors.name.message).toContain('at least 2');
    });
  });

  describe('User Repository', () => {
    test('should create a user via repository', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        passwordHash: 'hashed_123',
      };

      const user = await UserRepository.create(userData);

      expect(user).toHaveProperty('_id');
      expect(user.name).toBe('John Doe');
      expect(user.email).toBe('john@example.com');
    });

    test('should find user by ID', async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        passwordHash: 'hash123',
      });

      const found = await UserRepository.findById(user._id);

      expect(found).toBeDefined();
      expect(found._id.toString()).toBe(user._id.toString());
      expect(found.name).toBe('Test User');
    });

    test('should find user by email', async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        passwordHash: 'hash123',
      });

      const found = await UserRepository.findByEmail('test@example.com');

      expect(found).toBeDefined();
      expect(found.email).toBe('test@example.com');
    });

    test('should find user by email with password', async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        passwordHash: 'hashed_password_123',
      });

      const found = await UserRepository.findByEmailWithPassword('test@example.com');

      expect(found).toBeDefined();
      expect(found.passwordHash).toBe('hashed_password_123');
    });

    test('should check if email exists', async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'existing@example.com',
        passwordHash: 'hash123',
      });

      const exists = await UserRepository.emailExists('existing@example.com');
      expect(exists).toBe(true);

      const notExists = await UserRepository.emailExists('nonexistent@example.com');
      expect(notExists).toBe(false);
    });

    test('should update user', async () => {
      const user = await User.create({
        name: 'Original Name',
        email: 'test@example.com',
        passwordHash: 'hash123',
      });

      const updated = await UserRepository.update(user._id, {
        name: 'Updated Name',
      });

      expect(updated.name).toBe('Updated Name');
      expect(updated.email).toBe('test@example.com');
    });

    test('should not update email via update method', async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'original@example.com',
        passwordHash: 'hash123',
      });

      const updated = await UserRepository.update(user._id, {
        email: 'newemail@example.com', // Should be ignored
        name: 'New Name',
      });

      expect(updated.email).toBe('original@example.com'); // Email unchanged
      expect(updated.name).toBe('New Name');
    });

    test('should verify email', async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        passwordHash: 'hash123',
      });

      expect(user.isEmailVerified).toBe(false);

      const verified = await UserRepository.verifyEmail(user._id);

      expect(verified.isEmailVerified).toBe(true);
    });

    test('should deactivate user', async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        passwordHash: 'hash123',
      });

      expect(user.isActive).toBe(true);

      const deactivated = await UserRepository.deactivate(user._id);

      expect(deactivated.isActive).toBe(false);
    });

    test('should activate user', async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        passwordHash: 'hash123',
        isActive: false,
      });

      const activated = await UserRepository.activate(user._id);

      expect(activated.isActive).toBe(true);
    });

    test('should update last login', async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        passwordHash: 'hash123',
      });

      expect(user.lastLoginAt).toBeNull();

      const updated = await UserRepository.updateLastLogin(user._id);

      expect(updated.lastLoginAt).toBeInstanceOf(Date);
      expect(updated.lastLoginAt.getTime()).toBeLessThanOrEqual(
        Date.now()
      );
    });

    test('should count total users', async () => {
      await User.create({
        name: 'User 1',
        email: 'user1@example.com',
        passwordHash: 'hash123',
      });

      await User.create({
        name: 'User 2',
        email: 'user2@example.com',
        passwordHash: 'hash123',
      });

      const count = await UserRepository.count();

      expect(count).toBe(2);
    });

    test('should count active users', async () => {
      await User.create({
        name: 'Active User',
        email: 'active@example.com',
        passwordHash: 'hash123',
        isActive: true,
      });

      await User.create({
        name: 'Inactive User',
        email: 'inactive@example.com',
        passwordHash: 'hash123',
        isActive: false,
      });

      const activeCount = await UserRepository.countActive();

      expect(activeCount).toBe(1);
    });

    test('should handle duplicate email in repository create', async () => {
      await User.create({
        name: 'User 1',
        email: 'duplicate@example.com',
        passwordHash: 'hash123',
      });

      let error;
      try {
        await UserRepository.create({
          name: 'User 2',
          email: 'duplicate@example.com',
          passwordHash: 'hash456',
        });
      } catch (e) {
        error = e;
      }

      expect(error).toBeDefined();
      expect(error.statusCode).toBe(409); // Conflict
    });
  });

  describe('User Indexes', () => {
    test('should have unique index on email', async () => {
      const indexes = User.schema.indexes();
      const emailIndex = indexes.find(
        (idx) => idx[0].email === 1 && idx[1].unique === true
      );

      expect(emailIndex).toBeDefined();
    });

    test('should have index on role', async () => {
      const indexes = User.schema.indexes();
      const roleIndex = indexes.find((idx) => idx[0].role === 1);

      expect(roleIndex).toBeDefined();
    });

    test('should have index on createdAt', async () => {
      const indexes = User.schema.indexes();
      const createdAtIndex = indexes.find((idx) => idx[0].createdAt === 1);

      expect(createdAtIndex).toBeDefined();
    });
  });

  describe('User Virtuals', () => {
    test('should have isVerified virtual', async () => {
      const user = new User({
        name: 'Test User',
        email: 'test@example.com',
        passwordHash: 'hash123',
        isEmailVerified: true,
      });

      expect(user.isVerified).toBe(true);

      user.isEmailVerified = false;
      expect(user.isVerified).toBe(false);
    });
  });
});
