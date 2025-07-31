const UserService = require('../services/UserService');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { users } = require("../data/users");

jest.mock('bcrypt');
jest.mock('jsonwebtoken');

class MockDatabseService {

  constructor() {
    this.refreshTokens = [{ id: 1, token: 'token1' }, { id: 2, token: 'token2' }, { id: 3, token: 'validtoken' }];
    this.users = users.map((user, index) => { return { ...user, id: index + 1 } });
  }

  async getUser(username) {
    return Promise.resolve(this.users.find(user => user.username === username));
  }

  async getToken(token) {
    const refreshToken = this.refreshTokens.find(tokenItem => tokenItem.token === token);
    return Promise.resolve(refreshToken);
  }

  async tokenExists(token) {
    const refreshToken = await this.getToken(token);
    const tokenExists = !!refreshToken;
    return Promise.resolve(tokenExists);
  }

  async addRefreshToken(token) {
    const newId = this.refreshTokens.length + 1;
    this.refreshTokens = [...this.refreshTokens, { id: newId, token }];
  }

  addUser = async (username, password) => {
    const newId = this.users.length + 1;
    const newUser = { id: newId, username, password };
    this.users = [...this.users, newUser];
    return Promise.resolve(newUser);
  }

  async removeToken(token) {
    this.refreshTokens = this.refreshTokens.filter((tokenItem) => tokenItem.token !== token);
  }
};

describe('UserService', () => {
  let userService;

  let mockDatabaseService = new MockDatabseService();

  beforeEach(() => {
    process.env.ACCESS_TOKEN_SECRET = 'test_access_secret';
    process.env.REFRESH_TOKEN_SECRET = 'test_refresh_secret';
    process.env.SALT_ROUNDS = 10;
    jest.resetModules();
    jest.clearAllMocks();
  });

  describe('login', () => {
    userService = new UserService(mockDatabaseService);
    it('should return null if user not found', async () => {
      const result = await userService.login('baduser', 'password');
      expect(result).toBeNull();
    });

    it('should return null if password does not match', async () => {
      userService = new UserService(mockDatabaseService);
      const spy = jest.spyOn(userService, '_comparePassword').mockReturnValue(false);
      const result = await userService.login('user1', 'wrongpass');
      expect(result).toBeNull();
      expect(spy).toHaveBeenCalled();

    });

    it('should return tokens if login is successful', async () => {
      userService = new UserService(mockDatabaseService);
      const spy = jest.spyOn(userService, '_comparePassword').mockReturnValue(true);
      jwt.sign.mockReturnValueOnce('accessToken').mockReturnValueOnce('refreshToken');
      const result = await userService.login('user1', 'plain');
      expect(result).toEqual({ accessToken: 'accessToken', refreshToken: 'refreshToken' });
      expect(spy).toHaveBeenCalled();
    });

    it('should return tokens if login is successful', async () => {
      userService = new UserService(mockDatabaseService);
      const spy = jest.spyOn(userService, '_comparePassword').mockReturnValue(true);
      jwt.sign.mockReturnValueOnce('accessToken').mockReturnValueOnce('refreshToken');
      const result = await userService.login('user1', 'plain');
      expect(result).toEqual({ accessToken: 'accessToken', refreshToken: 'refreshToken' });
      expect(spy).toHaveBeenCalled();
    });

    it('should return undefined if login fails', async () => {
      userService = new UserService(mockDatabaseService);
      const spy = jest.spyOn(userService, '_comparePassword').mockImplementation((plainPassword, hashedPassword, cb) => cb(new Error('fail')));
      jwt.sign.mockReturnValueOnce('accessToken').mockReturnValueOnce('refreshToken');
      const result = await userService.login('user1', 'plain');
      expect(result).toBeUndefined()
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('refreshToken', () => {
    it('should return 403 if refresh token is not found', async () => {
      userService = new UserService(mockDatabaseService);
      const result = await userService.refreshToken('notfound');
      expect(result).toBe(403);
    });

    it('should return new access token if refresh token is valid', async () => {
      userService = new UserService(mockDatabaseService);
      jwt.verify.mockImplementation((token, secret, cb) => cb(null, { username: 'user1' }));
      const spy = jest.spyOn(userService, '_generateAccessToken').mockReturnValue('newAccessToken');
      const result = await userService.refreshToken('validtoken');
      expect(result).toEqual({ accessToken: 'newAccessToken' });
      expect(spy).toHaveBeenCalled();
    });

    it('should return 403 if jwt.verify fails', async () => {
      userService = new UserService(mockDatabaseService);
      jwt.verify.mockImplementation((token, secret, cb) => cb(new Error('fail')));
      const result = await userService.refreshToken('validtoken');
      expect(result).toBe(403);
    });
  });

  describe('verify', () => {
    it('should return 403 if jwt.verify fails', () => {
      userService = new UserService(mockDatabaseService);
      jwt.verify.mockImplementation((token, secret, cb) => cb(new Error('fail')));
      const result = userService.verify('badtoken');
      expect(result).toBeUndefined();
    });

    it('should return user if jwt.verify succeeds', () => {
      userService = new UserService(mockDatabaseService);
      jwt.verify.mockImplementation((token, secret, cb) => cb(null, { username: 'user1' }));
      const result = userService.verify('goodtoken');
      expect(result).toBeUndefined();
    });
  });

  describe('logout', () => {
    userService = new UserService(mockDatabaseService);
    it('should remove token from refreshTokens', async () => {
      userService.logout('token1');
      const foundToken = await mockDatabaseService.getToken("token1");
      expect(foundToken).toBeUndefined();
    });
  });

  describe('register', () => {

    it('should return 303 if user already exists', async () => {
      userService = new UserService(mockDatabaseService);
      mockDatabaseService.addUser('existing', 'password');
      const result = await userService.register('existing', 'password');
      expect(result).toBe(303);
    });

    it('should hash password and add user if user does not exist', async () => {
      userService = new UserService(mockDatabaseService);
      bcrypt.hash.mockResolvedValue('hashedPassword');
      const result = await userService.register('newuser', 'password');
      expect(bcrypt.hash).toHaveBeenCalledWith('password', 10);
      expect(result).toBe(true);
    });

    it('should return false if addUser fails', async () => {
      mockDatabaseService = new MockDatabseService();
      mockDatabaseService.addUser = jest.fn();
      mockDatabaseService.addUser.mockImplementation(() => Promise.reject(new Error('fail')));
      userService = new UserService(mockDatabaseService);

      const spy = jest.spyOn(userService, '_hashPassword').mockReturnValue('hashed_password');
      const result = await userService.register('failuser', 'password');
      expect(result).toBe(false);
      expect(spy).toHaveBeenCalled();
    });

    it('should handle errors and return false', async () => {
      mockDatabaseService = new MockDatabseService();
      mockDatabaseService.getUser = jest.fn();
      mockDatabaseService.getUser.mockResolvedValue(null);
      userService = new UserService(mockDatabaseService);
      const spy = jest.spyOn(userService, '_hashPassword').mockRejectedValue(new Error('fail'));
      const result = await userService.register('erroruser', 'password');
      expect(result).toBe(false);
      expect(spy).toHaveBeenCalled();
    });


  });
});