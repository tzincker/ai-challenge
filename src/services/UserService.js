const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;

class UserService {

  constructor(databaseService) {
    this.saltRounds = parseInt(process.env.SALT_ROUNDS);
    this.databaseService = databaseService;
  }

  /* v8 ignore start */
  _generateAccessToken = (user) => {
    const accessToken = jwt.sign(user, accessTokenSecret, { expiresIn: "15s" });
    return accessToken;
  };

  async _hashPassword(plainPassword) {
    try {
      const hashedPassword = await bcrypt.hash(plainPassword, this.saltRounds);
      return hashedPassword;
    } catch (error) {
      console.error("There was an error hashing the password.");
    }
  }

  async _comparePassword(plainPassword, hashedPassword) {
    try {
      const comparedPassword = await bcrypt.compare(plainPassword, hashedPassword);
      return comparedPassword;
    } catch (error) {
      console.error("There was an error trying to compare the password: ", error);
    }
  }
  /* v8 ignore stop */

  verify(token) {
    jwt.verify(token, accessTokenSecret, (err, user) => {
      if (err) {
        console.error("Unable to login user: ", err);
        return 403;
      }

      return user;
    });
  }

  async login(username, password) {
    const user = await this.databaseService.getUser(username);
    if (!user) {
      return null;
    }

    try {
      const passwordMatches = await this._comparePassword(password, user.password);

      if (!passwordMatches) {
        return null;
      }
      const accessToken = this._generateAccessToken(user);
      const refreshToken = jwt.sign(user, refreshTokenSecret);
      await this.databaseService.addRefreshToken(refreshToken);
      return { accessToken, refreshToken };
    } catch (error) {
      console.error("Unable to login user: ", error);
      return undefined;
    }
  }

  async register(username, password) {
    const user = await this.databaseService.getUser(username);
    if (user) {
      return 303
    }

    try {
      const hashedPassword = await this._hashPassword(password);

      const newUser = await this.databaseService.addUser(username, hashedPassword)
      return !!newUser;
    } catch (error) {
      console.error("Unable to register user: ", error);
      return false;
    }
  }

  async refreshToken(refreshToken) {
    const tokenExists = await this.databaseService.tokenExists(refreshToken);
    if (!tokenExists) {
      return 403;
    }

    const result = jwt.verify(refreshToken, refreshTokenSecret, (err, user) => {
      if (err) {
        console.error("Unable to refresh token: ", err);
        return 403;
      }

      const accessToken = this._generateAccessToken(user);
      return { accessToken };
    });
    return result;
  }

  async logout(token) {
    await this.databaseService.removeToken(token);
  }

}

module.exports = UserService;