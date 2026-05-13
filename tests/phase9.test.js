const PasswordService = require('../src/services/password.service');
const { AppError } = require('../src/utils');

describe('Phase 9: Password Hashing Service', () => {
  describe('hashPassword', () => {
    it('should hash a valid password', async () => {
      const password = 'Password123!';
      const hash = await PasswordService.hashPassword(password);

      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash.length).toBeGreaterThan(0);
      expect(hash).not.toEqual(password);
    });

    it('should generate different hashes for the same password', async () => {
      const password = 'Password123!';
      const hash1 = await PasswordService.hashPassword(password);
      const hash2 = await PasswordService.hashPassword(password);

      expect(hash1).not.toEqual(hash2);
    });

    it('should reject empty password', async () => {
      try {
        await PasswordService.hashPassword('');
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('non-empty');
      }
    });

    it('should reject null password', async () => {
      try {
        await PasswordService.hashPassword(null);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('non-empty');
      }
    });

    it('should reject undefined password', async () => {
      try {
        await PasswordService.hashPassword(undefined);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('non-empty');
      }
    });

    it('should reject non-string password', async () => {
      try {
        await PasswordService.hashPassword(123);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('non-empty');
      }
    });

    it('should reject password shorter than 8 characters', async () => {
      try {
        await PasswordService.hashPassword('Pass123');
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('at least 8 characters');
      }
    });

    it('should accept password with special characters', async () => {
      const password = 'P@ssw0rd!#$%^&*()';
      const hash = await PasswordService.hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toEqual(password);
    });

    it('should accept long passwords', async () => {
      const password = 'a'.repeat(100);
      const hash = await PasswordService.hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toEqual(password);
    });

    it('should accept password with spaces', async () => {
      const password = 'Pass word 123!';
      const hash = await PasswordService.hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toEqual(password);
    });
  });

  describe('comparePassword', () => {
    let validHash;
    const validPassword = 'Password123!';

    beforeAll(async () => {
      validHash = await PasswordService.hashPassword(validPassword);
    });

    it('should return true for correct password', async () => {
      const result = await PasswordService.comparePassword(validPassword, validHash);
      expect(result).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const result = await PasswordService.comparePassword('wrongPassword', validHash);
      expect(result).toBe(false);
    });

    it('should reject empty string password in comparison', async () => {
      try {
        await PasswordService.comparePassword('', validHash);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('non-empty');
      }
    });

    it('should reject null password in comparison', async () => {
      try {
        await PasswordService.comparePassword(null, validHash);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('non-empty');
      }
    });

    it('should reject undefined password in comparison', async () => {
      try {
        await PasswordService.comparePassword(undefined, validHash);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('non-empty');
      }
    });

    it('should reject non-string password in comparison', async () => {
      try {
        await PasswordService.comparePassword(123, validHash);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('non-empty');
      }
    });

    it('should reject null hash in comparison', async () => {
      try {
        await PasswordService.comparePassword(validPassword, null);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('Password hash must be');
      }
    });

    it('should reject undefined hash in comparison', async () => {
      try {
        await PasswordService.comparePassword(validPassword, undefined);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('Password hash must be');
      }
    });

    it('should reject empty string hash in comparison', async () => {
      try {
        await PasswordService.comparePassword(validPassword, '');
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('Password hash must be');
      }
    });

    it('should reject non-string hash in comparison', async () => {
      try {
        await PasswordService.comparePassword(validPassword, 123);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('Password hash must be');
      }
    });

    it('should be case-sensitive', async () => {
      const result = await PasswordService.comparePassword('password123!', validHash);
      expect(result).toBe(false);
    });

    it('should handle whitespace differences', async () => {
      const result = await PasswordService.comparePassword('Password123! ', validHash);
      expect(result).toBe(false);
    });

    it('should compare password with special characters correctly', async () => {
      const password = 'P@ssw0rd!#$%^&*()';
      const hash = await PasswordService.hashPassword(password);
      const result = await PasswordService.comparePassword(password, hash);
      expect(result).toBe(true);
    });

    it('should compare long passwords correctly', async () => {
      const password = 'a'.repeat(100);
      const hash = await PasswordService.hashPassword(password);
      const result = await PasswordService.comparePassword(password, hash);
      expect(result).toBe(true);
    });

    it('should return false for similar but different passwords', async () => {
      const result = await PasswordService.comparePassword('Password124!', validHash);
      expect(result).toBe(false);
    });

    it('should return false for partial password match', async () => {
      const result = await PasswordService.comparePassword('Password12', validHash);
      expect(result).toBe(false);
    });
  });

  describe('Round-trip hashing and comparison', () => {
    const testPasswords = [
      'Password123!',
      'MySecure@Pass2024',
      'C0mplex!P@ssw0rd',
      'aabbccddee12345fghij',
      'Test$Password#2024!',
    ];

    testPasswords.forEach((password) => {
      it(`should hash and verify password: ${password.substring(0, 10)}...`, async () => {
        const hash = await PasswordService.hashPassword(password);
        const isMatch = await PasswordService.comparePassword(password, hash);
        expect(isMatch).toBe(true);
      });
    });
  });

  describe('Security properties', () => {
    it('should not expose password in hash', async () => {
      const password = 'MyPassword123!';
      const hash = await PasswordService.hashPassword(password);

      expect(hash).not.toContain(password);
      expect(hash).not.toContain('MyPassword');
      expect(hash).not.toContain('123');
    });

    it('should produce bcrypt format hash', async () => {
      const password = 'Password123!';
      const hash = await PasswordService.hashPassword(password);

      // Bcrypt hashes start with $2a$, $2b$, or $2y$
      expect(hash).toMatch(/^\$2[aby]\$/);
    });

    it('should produce consistent length hashes', async () => {
      const passwords = [
        'ValidPass1!',
        'LongPasswordWithMany Characters And Special!@#',
        'Medium-Length-Pass123!',
      ];

      const hashes = await Promise.all(
        passwords.map((p) => PasswordService.hashPassword(p))
      );

      const lengths = hashes.map((h) => h.length);
      const uniqueLengths = new Set(lengths);

      // Bcrypt hashes should all be the same length (60 characters)
      expect(uniqueLengths.size).toBe(1);
      expect(lengths[0]).toBe(60);
    });
  });
});
