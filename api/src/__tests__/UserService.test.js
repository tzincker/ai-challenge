const UserService = require('../services/UserService');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

jest.mock('bcrypt');
jest.mock('jsonwebtoken');

describe('UserService', () => {
  let userService;

  beforeEach(() => {
    process.env.ACCESS_TOKEN_SECRET = 'test_access_secret';
    process.env.REFRESH_TOKEN_SECRET = 'test_refresh_secret';
    process.env.SALT_ROUNDS = 10;
    jest.resetModules();
    jest.clearAllMocks();
  });

  describe('hashPassword', () => {
    it('should hash a password', async () => {
      userService = new UserService();
      bcrypt.hash.mockResolvedValue('hashed_password');
      const result = await userService.hashPassword('plain');
      expect(bcrypt.hash).toHaveBeenCalledWith('plain', 10);
      expect(result).toBe('hashed_password');
    });
  });

  describe('comparePassword', () => {
    it('should compare passwords', async () => {
      userService = new UserService();
      bcrypt.compare.mockResolvedValue(true);
      const result = await userService.comparePassword('plain', 'hashed_password');
      expect(bcrypt.compare).toHaveBeenCalledWith('plain', 'hashed_password');
      expect(result).toBe(true);
    });
  });

  describe('login', () => {
    userService = new UserService();
    it('should return null if user not found', async () => {
      userService.comparePassword = jest.fn();
      const result = await userService.login('user1', 'password');
      expect(result).toBeNull();
    });

    it('should return null if password does not match', async () => {
      userService.comparePassword = jest.fn().mockResolvedValue(false);
      const result = await userService.login('user1', 'wrongpass');
      expect(result).toBeNull();
    });

    it('should return tokens if login is successful', async () => {
      userService.comparePassword = jest.fn().mockResolvedValue(true);
      jwt.sign.mockReturnValueOnce('accessToken').mockReturnValueOnce('refreshToken');
      const result = await userService.login('user1', 'hashed_password');
      expect(result).toEqual({ accessToken: 'accessToken', refreshToken: 'refreshToken' });
    });
  });

  describe('refreshToken', () => {
    it('should return 403 if refresh token is not found', () => {
      userService.refreshTokens = [];
      const result = userService.refreshToken('notfound');
      expect(result).toBe(403);
    });

    it('should return new access token if refresh token is valid', () => {
      userService.refreshTokens = ['validtoken'];
      jwt.verify.mockImplementation((token, secret, cb) => cb(null, { username: 'user1' }));
      userService._generateAccessToken = jest.fn().mockReturnValue('newAccessToken');
      const result = userService.refreshToken('validtoken');
      expect(result).toEqual({ accessToken: 'newAccessToken' });
    });

    it('should return 403 if jwt.verify fails', () => {
      userService.refreshTokens = ['validtoken'];
      jwt.verify.mockImplementation((token, secret, cb) => cb(new Error('fail')));
      const result = userService.refreshToken('validtoken');
      expect(result).toBe(403);
    });
  });

  describe('verify', () => {
    it('should return 403 if jwt.verify fails', () => {
      jwt.verify.mockImplementation((token, secret, cb) => cb(new Error('fail')));
      const result = userService.verify('badtoken');
      expect(result).toBeUndefined();
    });

    it('should return user if jwt.verify succeeds', () => {
      jwt.verify.mockImplementation((token, secret, cb) => cb(null, { username: 'user1' }));
      const result = userService.verify('goodtoken');
      expect(result).toBeUndefined();
    });
  });

  describe('logout', () => {
    it('should remove token from refreshTokens', () => {
      userService.refreshTokens = ['token1', 'token2'];
      userService.logout('token1');
      expect(userService.refreshTokens).toEqual(['token2']);
    });
  });
});