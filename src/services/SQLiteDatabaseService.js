const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class SQLiteDatabaseService {
  constructor() {
    // Crear directorio de base de datos si no existe
    const dbDir = path.join(__dirname, '../../database');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // Configuración de SQLite
    this.dbPath = path.join(dbDir, 'ai_challenge.db');
    this.db = null;

    console.log(`📄 SQLite database ubicado en: ${this.dbPath}`);
  }

  // Conectar a SQLite
  async connect() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, err => {
        if (err) {
          console.error('❌ Error conectando a SQLite:', err);
          reject(err);
        } else {
          console.log('📄 Conexión exitosa a SQLite');
          resolve();
        }
      });
    });
  }

  // Método para verificar la conexión
  async testConnection() {
    try {
      if (!this.db) await this.connect();

      return new Promise((resolve, reject) => {
        this.db.get("SELECT datetime('now') as now", (err, row) => {
          if (err) {
            console.error('❌ Error en test de conexión SQLite:', err);
            reject(err);
          } else {
            console.log('✅ Conexión a SQLite exitosa:', row);
            resolve(row);
          }
        });
      });
    } catch (err) {
      console.error('❌ Error en testConnection:', err);
      throw err;
    }
  }

  // Crear tablas si no existen
  async initializeTables() {
    if (!this.db) await this.connect();

    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const createUserSessionsTable = `
      CREATE TABLE IF NOT EXISTS user_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        refresh_token TEXT UNIQUE NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `;

    const createPasswordResetTable = `
      CREATE TABLE IF NOT EXISTS password_resets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        reset_code TEXT NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `;

    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run(createUsersTable, err => {
          if (err) {
            console.error('❌ Error creando tabla users:', err);
            reject(err);
            return;
          }
        });

        this.db.run(createUserSessionsTable, err => {
          if (err) {
            console.error('❌ Error creando tabla user_sessions:', err);
            reject(err);
            return;
          }
        });

        this.db.run(createPasswordResetTable, err => {
          if (err) {
            console.error('❌ Error creando tabla password_resets:', err);
            reject(err);
            return;
          }
          console.log('✅ Tablas SQLite inicializadas correctamente');
          resolve();
        });
      });
    });
  }

  // Ejecutar query con parámetros
  async query(sql, params = []) {
    if (!this.db) await this.connect();

    return new Promise((resolve, reject) => {
      if (sql.trim().toUpperCase().startsWith('SELECT')) {
        // Para SELECT queries
        this.db.all(sql, params, (err, rows) => {
          if (err) {
            console.error('❌ Error en query SELECT:', err);
            reject(err);
          } else {
            resolve({ rows, rowCount: rows.length });
          }
        });
      } else {
        // Para INSERT, UPDATE, DELETE
        this.db.run(sql, params, function (err) {
          if (err) {
            console.error('❌ Error en query:', err);
            reject(err);
          } else {
            resolve({
              rowCount: this.changes,
              insertId: this.lastID,
              rows: [],
            });
          }
        });
      }
    });
  }

  // Cerrar conexión
  async close() {
    if (this.db) {
      return new Promise(resolve => {
        this.db.close(err => {
          if (err) {
            console.error('❌ Error cerrando SQLite:', err);
          } else {
            console.log('📄 Conexión SQLite cerrada');
          }
          resolve();
        });
      });
    }
  }

  // Métodos específicos para usuarios (compatibilidad con PostgreSQL)
  async createUser(username, email, passwordHash) {
    const sql = `
      INSERT INTO users (username, email, password_hash)
      VALUES (?, ?, ?)
    `;
    const result = await this.query(sql, [username, email, passwordHash]);
    return {
      id: result.insertId,
      username,
      email,
      password_hash: passwordHash,
      created_at: new Date(),
      updated_at: new Date(),
    };
  }

  async findUserByEmail(email) {
    const sql = 'SELECT * FROM users WHERE email = ?';
    const result = await this.query(sql, [email]);
    return result.rows[0] || null;
  }

  async findUserByUsername(username) {
    const sql = 'SELECT * FROM users WHERE username = ?';
    const result = await this.query(sql, [username]);
    return result.rows[0] || null;
  }

  async findUserById(id) {
    const sql = 'SELECT * FROM users WHERE id = ?';
    const result = await this.query(sql, [id]);
    return result.rows[0] || null;
  }

  async updateUserPasswordById(userId, newPasswordHash) {
    const sql = `
      UPDATE users 
      SET password_hash = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    await this.query(sql, [newPasswordHash, userId]);
  }

  async storeRefreshToken(userId, refreshToken, expiresAt) {
    const sql = `
      INSERT INTO user_sessions (user_id, refresh_token, expires_at)
      VALUES (?, ?, ?)
    `;
    await this.query(sql, [userId, refreshToken, expiresAt]);
  }

  async findRefreshToken(refreshToken) {
    const sql = `
      SELECT us.*, u.username, u.email
      FROM user_sessions us
      JOIN users u ON us.user_id = u.id
      WHERE us.refresh_token = ? AND us.expires_at > datetime('now')
    `;
    const result = await this.query(sql, [refreshToken]);
    return result.rows[0] || null;
  }

  async deleteRefreshToken(refreshToken) {
    const sql = 'DELETE FROM user_sessions WHERE refresh_token = ?';
    await this.query(sql, [refreshToken]);
  }

  async deleteExpiredTokens() {
    const sql = "DELETE FROM user_sessions WHERE expires_at <= datetime('now')";
    const result = await this.query(sql);
    return result;
  }

  // 🧹 MEJORA: Limpiar códigos de reset expirados
  async deleteExpiredPasswordResets() {
    const sql =
      "DELETE FROM password_resets WHERE expires_at <= datetime('now')";
    const result = await this.query(sql);
    return result;
  }

  // Alias para compatibilidad con PostgreSQL
  async cleanExpiredTokens() {
    try {
      const tokensResult = await this.deleteExpiredTokens();
      const resetsResult = await this.deleteExpiredPasswordResets();

      const totalCleaned =
        (tokensResult.rowCount || 0) + (resetsResult.rowCount || 0);
      console.log(
        `🧹 Limpiados ${tokensResult.rowCount || 0} tokens expirados y ${resetsResult.rowCount || 0} códigos de reset expirados de SQLite`
      );

      return totalCleaned;
    } catch (error) {
      console.error('Error limpiando tokens y códigos expirados:', error);
      throw error;
    }
  }

  // Métodos adicionales para compatibilidad con UserService
  async getUser(usernameOrEmail) {
    // Intentar primero por username, luego por email
    let user = await this.findUserByUsername(usernameOrEmail);
    if (!user) {
      user = await this.findUserByEmail(usernameOrEmail);
    }
    return user;
  }

  async addUser(username, email, passwordHash) {
    return await this.createUser(username, email, passwordHash);
  }

  async addRefreshToken(refreshToken, userId) {
    // Los tokens expiran en 7 días
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await this.storeRefreshToken(userId, refreshToken, expiresAt.toISOString());
  }

  async tokenExists(refreshToken) {
    const token = await this.findRefreshToken(refreshToken);
    return !!token;
  }

  async removeRefreshToken(refreshToken) {
    await this.deleteRefreshToken(refreshToken);
  }

  // 🔄 MEJORA: Alias para compatibilidad
  async removeToken(refreshToken) {
    await this.removeRefreshToken(refreshToken);
  }

  async updateUserPassword(usernameOrEmail, newPasswordHash) {
    const user = await this.getUser(usernameOrEmail);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }
    await this.updateUserPasswordById(user.id, newPasswordHash);
    return true;
  }

  async removeAllUserRefreshTokens(userId) {
    const sql = 'DELETE FROM user_sessions WHERE user_id = ?';
    await this.query(sql, [userId]);
  }

  // Métodos para reset de password
  async storePasswordResetCode(userId, resetCode, expiresAt) {
    const sql = `
      INSERT INTO password_resets (user_id, reset_code, expires_at)
      VALUES (?, ?, ?)
    `;
    await this.query(sql, [userId, resetCode, expiresAt]);
  }

  async verifyPasswordResetCode(userId, resetCode) {
    const sql = `
      SELECT * FROM password_resets 
      WHERE user_id = ? AND reset_code = ? AND expires_at > datetime('now')
    `;
    const result = await this.query(sql, [userId, resetCode]);
    return result.rows.length > 0;
  }

  async deletePasswordResetCode(userId) {
    const sql = 'DELETE FROM password_resets WHERE user_id = ?';
    await this.query(sql, [userId]);
  }

  // 📊 MEJORA: Método para obtener estadísticas de la base de datos
  async getDatabaseStats() {
    try {
      const usersResult = await this.query(
        'SELECT COUNT(*) as count FROM users'
      );
      const sessionsResult = await this.query(
        'SELECT COUNT(*) as count FROM user_sessions WHERE expires_at > datetime("now")'
      );
      const resetsResult = await this.query(
        'SELECT COUNT(*) as count FROM password_resets WHERE expires_at > datetime("now")'
      );

      return {
        totalUsers: usersResult.rows[0]?.count || 0,
        activeSessions: sessionsResult.rows[0]?.count || 0,
        pendingResets: resetsResult.rows[0]?.count || 0,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      throw error;
    }
  }
}

module.exports = SQLiteDatabaseService;
