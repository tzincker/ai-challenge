/* c8 ignore file */
const { users } = require('../data/users');

class DatabaseService {
  constructor(db) {
    this._db = db;

    // initialize users table
    this._db.exec(
      'CREATE TABLE users(id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL UNIQUE, password TEXT NOT NULL) STRICT'
    );

    // populate with default data.

    const insert = this._db.prepare(
      'INSERT INTO users (username, password) VALUES (?, ?)'
    );
    users.forEach(user => {
      insert.run(user.username, user.password);
    });
    insert.finalize();

    // initialize refresh tokens table
    this._db.exec(
      'CREATE TABLE refresh_tokens (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, token TEXT NOT NULL UNIQUE) STRICT'
    );
  }

  async _getUserFromDb(db, username) {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM users WHERE username = ?',
        [username],
        (err, row) => {
          if (err) {
            reject(err);
          }
          resolve(row);
        }
      );
    });
  }

  async getUser(username) {
    try {
      const user = await this._getUserFromDb(this._db, username);
      return user;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Unable to fetch user.');
    }
  }

  async _findTokenFromDb(db, token) {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM refresh_tokens WHERE token = ?',
        [token],
        (err, row) => {
          if (err) {
            reject(err);
          }
          resolve(row);
        }
      );
    });
  }

  async getToken(token) {
    try {
      const foundToken = await this._findTokenFromDb(this._db, token);
      return foundToken;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Unable to fetch token.');
    }
  }

  async tokenExists(token) {
    try {
      const refreshToken = await this.getToken(token);
      const tokenExists = !!refreshToken;
      return tokenExists;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Unable to check token existance.');
    }
  }

  async _insertUserToDb(db, username, password) {
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO users (username, password) VALUES (?, ?)',
        [username, password],
        (err) => {
          if (err) {
            // eslint-disable-next-line no-console
            console.error(err.message);
            reject(err);
          }
          // In SQLite3, lastID is a property of the statement object
          const lastID = db.run.lastID;
          resolve({ id: lastID, username, password });
        }
      );
    });
  }

  async _deleteTokenFromDb(db, token) {
    return new Promise((resolve, reject) => {
      db.run(
        'DELETE FROM refresh_tokens WHERE token = ?',
        [token],
        (err) => {
          if (err) {
            // eslint-disable-next-line no-console
            console.error(err.message);
            reject(err);
          }
          // In SQLite3, changes is a property of the statement object
          const rowsAffected = db.run.changes;
          // eslint-disable-next-line no-console
          console.log(`Removed ${rowsAffected} refresh token(s)`);
          resolve();
        }
      );
    });
  }

  async addRefreshToken(token) {
    try {
      const foundToken = await this.getToken(token);
      if (foundToken) {
        // eslint-disable-next-line no-console
        console.error('Refresh token already exits.');
        throw new Error('Refresh token already exits.');
      }

      await this._insertTokenToDb(this._db, token);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Unable to add refresh token: ', error);
    }
  }

  async addUser(username, password) {
    try {
      const foundUser = await this.getUser(username);
      if (foundUser) {
        // eslint-disable-next-line no-console
        console.error('User already exits.');
        throw new Error('User already exits.');
      }

      const newUser = await this._insertUserToDb(this._db, username, password);
      return newUser;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Unable to add new user: ', error);
    }
  }

  async removeToken(token) {
    try {
      const foundToken = await this.getToken(token);
      if (!foundToken) {
        // eslint-disable-next-line no-console
        console.warn('Token no longer exists, aborting.');
        return;
      }

      await this._deleteTokenFromDb(this._db, token);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Unable to delete refresh token: ', error);
    }
  }
}

module.exports = DatabaseService;
