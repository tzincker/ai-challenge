const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;

class UserService {
  constructor(databaseService) {
    this.saltRounds = parseInt(process.env.SALT_ROUNDS);
    this.databaseService = databaseService;
  }

  /* v8 ignore start */
  _generateAccessToken = user => {
    const accessToken = jwt.sign(user, accessTokenSecret, { expiresIn: '2h' });
    return accessToken;
  };

  async _hashPassword(plainPassword) {
    try {
      const hashedPassword = await bcrypt.hash(plainPassword, this.saltRounds);
      return hashedPassword;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('There was an error hashing the password.');
    }
  }

  async _comparePassword(plainPassword, hashedPassword) {
    try {
      const comparedPassword = await bcrypt.compare(
        plainPassword,
        hashedPassword
      );
      return comparedPassword;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(
        'There was an error trying to compare the password: ',
        error
      );
    }
  }
  /* v8 ignore stop */

  verify(token) {
    try {
      return jwt.verify(token, accessTokenSecret);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Unable to verify token: ', err.message);
      return null;
    }
  }

  async login(username, password) {
    const user = await this.databaseService.getUser(username);
    if (!user) {
      return null;
    }

    try {
      const passwordMatches = await this._comparePassword(
        password,
        user.password_hash
      );

      if (!passwordMatches) {
        return null;
      }
      const accessToken = this._generateAccessToken(user);
      const refreshToken = jwt.sign(user, refreshTokenSecret, {
        expiresIn: '7d',
      }); // 7 días para refresh token
      await this.databaseService.addRefreshToken(refreshToken, user.id);
      return { accessToken, refreshToken };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Unable to login user: ', error);
      return undefined;
    }
  }

  async register(username, password) {
    // Validar entrada
    const usernameValidation = this.validateUsername(username);
    if (!usernameValidation.valid) {
      return { success: false, message: usernameValidation.message };
    }

    const passwordValidation = this.validatePassword(password);
    if (!passwordValidation.valid) {
      return { success: false, message: passwordValidation.message };
    }

    const user = await this.databaseService.getUser(username);
    if (user) {
      return { success: false, message: 'Username is already taken' };
    }

    try {
      const hashedPassword = await this._hashPassword(password);

      const newUser = await this.databaseService.addUser(
        username,
        null,
        hashedPassword
      );
      return {
        success: true,
        message: 'User registered successfully',
        user: !!newUser,
      };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Unable to register user: ', error);
      return { success: false, message: 'Error interno del servidor' };
    }
  }

  async refreshToken(refreshToken) {
    try {
      const tokenExists = await this.databaseService.tokenExists(refreshToken);
      if (!tokenExists) {
        return { error: 'Invalid token', status: 403 };
      }

      const decoded = jwt.verify(refreshToken, refreshTokenSecret);
      const accessToken = this._generateAccessToken(decoded);

      return { accessToken };
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Unable to verify token: ', err.message);

      // If token is invalid, remove it from database
      try {
        await this.databaseService.removeRefreshToken(refreshToken);
      } catch (removeError) {
        // eslint-disable-next-line no-console
        console.error('Error removing invalid token:', removeError);
        return { error: 'Error removing invalid token', status: 403 };
      }

      return { error: 'Invalid or expired token', status: 403 };
    }
  }

  async logout(token) {
    await this.databaseService.removeToken(token);
  }

  // Validaciones para registro
  validateUsername(username) {
    if (!username) {
      return { valid: false, message: 'Username is required' };
    }
    if (username.length < 3) {
      return {
        valid: false,
        message: 'Username must be at least 3 characters long',
      };
    }
    if (username.length > 20) {
      return {
        valid: false,
        message: 'Username cannot be longer than 20 characters',
      };
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return {
        valid: false,
        message: 'Username can only contain letters, numbers and underscores',
      };
    }
    return { valid: true };
  }

  validatePassword(password) {
    if (!password) {
      return { valid: false, message: 'Password is required' };
    }
    if (password.length < 6) {
      return {
        valid: false,
        message: 'Password must be at least 6 characters long',
      };
    }
    if (password.length > 50) {
      return {
        valid: false,
        message: 'Password cannot be longer than 50 characters',
      };
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return {
        valid: false,
        message:
          'Password must contain at least one uppercase letter, one lowercase letter, and one number',
      };
    }
    // 🔐 IMPROVEMENT: Validate against common passwords
    const commonPasswords = [
      '123456',
      'password',
      '123456789',
      '12345678',
      '12345',
      '1234567',
      'password123',
      'admin',
    ];
    if (
      commonPasswords.some(common =>
        password.toLowerCase().includes(common.toLowerCase())
      )
    ) {
      return {
        valid: false,
        message: 'Password is too common. Please choose a more secure one',
      };
    }
    return { valid: true };
  }

  // Reset de password
  async requestPasswordReset(username) {
    const user = await this.databaseService.getUser(username);
    if (!user) {
      // Por seguridad, no revelamos si el usuario existe o no
      return {
        success: true,
        message: 'Si el usuario existe, se enviará un código de recuperación',
      };
    }

    // Generar código de 6 dígitos
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15); // 15 minutos de expiración

    try {
      // 🧹 MEJORA: Limpiar códigos anteriores antes de crear uno nuevo
      await this.databaseService.deletePasswordResetCode(user.id);
      await this.databaseService.storePasswordResetCode(
        user.id,
        resetCode,
        expiresAt.toISOString()
      );

      // En un proyecto real, aquí enviarías el código por email/SMS
      // eslint-disable-next-line no-console
      console.log(
        `🔑 Código de recuperación generado para ${username} (válido por 15 minutos)`
      );

      return {
        success: true,
        message: 'Si el usuario existe, se enviará un código de recuperación',
        // 🔐 MEJORA DE SEGURIDAD: Removido resetCode de la respuesta
      };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error storing password reset code:', error);
      return { success: false, message: 'Error interno del servidor' };
    }
  }

  // Reset de contraseña simplificado - solo requiere usuario y nueva contraseña
  async resetPassword(username, newPassword) {
    // Validar entrada
    if (
      !username ||
      typeof username !== 'string' ||
      username.trim().length < 3
    ) {
      return { success: false, message: 'Invalid username' };
    }

    const passwordValidation = this.validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return { success: false, message: passwordValidation.message };
    }

    const user = await this.databaseService.getUser(username.trim());
    if (!user) {
      return { success: false, message: 'User not found' };
    }

    try {
      const hashedPassword = await this._hashPassword(newPassword);
      await this.databaseService.updateUserPasswordById(
        user.id,
        hashedPassword
      );

      // 🔐 SECURITY IMPROVEMENT: Invalidate all active user sessions
      await this.databaseService.removeAllUserRefreshTokens(user.id);

      return {
        success: true,
        message:
          'Password successfully updated. All sessions have been closed for security.',
      };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error resetting password:', error);
      return { success: false, message: 'Error interno del servidor' };
    }
  }
}

module.exports = UserService;
