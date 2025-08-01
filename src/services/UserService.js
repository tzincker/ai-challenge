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
      const passwordMatches = await this._comparePassword(password, user.password_hash);

      if (!passwordMatches) {
        return null;
      }
      const accessToken = this._generateAccessToken(user);
      const refreshToken = jwt.sign(user, refreshTokenSecret);
      await this.databaseService.addRefreshToken(refreshToken, user.id);
      return { accessToken, refreshToken };
    } catch (error) {
      console.error("Unable to login user: ", error);
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
      return { success: false, message: "El nombre de usuario ya está en uso" };
    }

    try {
      const hashedPassword = await this._hashPassword(password);

      const newUser = await this.databaseService.addUser(username, null, hashedPassword)
      return { success: true, message: "Usuario registrado exitosamente", user: !!newUser };
    } catch (error) {
      console.error("Unable to register user: ", error);
      return { success: false, message: "Error interno del servidor" };
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

  // Validaciones para registro
  validateUsername(username) {
    if (!username) {
      return { valid: false, message: "El nombre de usuario es requerido" };
    }
    if (username.length < 3) {
      return { valid: false, message: "El nombre de usuario debe tener al menos 3 caracteres" };
    }
    if (username.length > 20) {
      return { valid: false, message: "El nombre de usuario no puede tener más de 20 caracteres" };
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return { valid: false, message: "El nombre de usuario solo puede contener letras, números y guiones bajos" };
    }
    return { valid: true };
  }

  validatePassword(password) {
    if (!password) {
      return { valid: false, message: "La contraseña es requerida" };
    }
    if (password.length < 6) {
      return { valid: false, message: "La contraseña debe tener al menos 6 caracteres" };
    }
    if (password.length > 50) {
      return { valid: false, message: "La contraseña no puede tener más de 50 caracteres" };
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return { valid: false, message: "La contraseña debe contener al menos una mayúscula, una minúscula y un número" };
    }
    return { valid: true };
  }

  // Reset de password
  async requestPasswordReset(username) {
    const user = await this.databaseService.getUser(username);
    if (!user) {
      // Por seguridad, no revelamos si el usuario existe o no
      return { success: true, message: "Si el usuario existe, se enviará un código de recuperación" };
    }

    // Generar código de 6 dígitos
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15); // 15 minutos de expiración

    try {
      await this.databaseService.storePasswordResetCode(user.id, resetCode, expiresAt.toISOString());
      
      // En un proyecto real, aquí enviarías el código por email/SMS
      console.log(`🔑 Código de recuperación para ${username}: ${resetCode} (válido por 15 minutos)`);
      
      return { 
        success: true, 
        message: "Si el usuario existe, se enviará un código de recuperación",
        resetCode: resetCode // Solo para desarrollo - remover en producción
      };
    } catch (error) {
      console.error("Error storing password reset code:", error);
      return { success: false, message: "Error interno del servidor" };
    }
  }

  async resetPassword(username, resetCode, newPassword) {
    // Validar nueva contraseña
    const passwordValidation = this.validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return { success: false, message: passwordValidation.message };
    }

    const user = await this.databaseService.getUser(username);
    if (!user) {
      return { success: false, message: "Usuario no encontrado" };
    }

    try {
      const isValidCode = await this.databaseService.verifyPasswordResetCode(user.id, resetCode);
      if (!isValidCode) {
        return { success: false, message: "Código de recuperación inválido o expirado" };
      }

      const hashedPassword = await this._hashPassword(newPassword);
      await this.databaseService.updateUserPasswordById(user.id, hashedPassword);
      await this.databaseService.deletePasswordResetCode(user.id);

      return { success: true, message: "Contraseña actualizada exitosamente" };
    } catch (error) {
      console.error("Error resetting password:", error);
      return { success: false, message: "Error interno del servidor" };
    }
  }

}

module.exports = UserService;