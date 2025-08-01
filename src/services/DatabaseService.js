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

  async getUser(username) {
    try {
      async function getUser(db, username) {
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

      const user = await getUser(this._db, username);
      return user;
    } catch (error) {
      console.error('Unable to fetch user.');
    }
  }

  async getToken(token) {
    try {
      async function findToken(db, token) {
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

      const refreshToken = await findToken(this._db, token);
      return refreshToken;
    } catch (error) {
      console.error('Unable to fetch token.');
    }
  }

  async tokenExists(token) {
    try {
      const refreshToken = await this.getToken(token);
      const tokenExists = !!refreshToken;
      return tokenExists;
    } catch (error) {
      console.error('Unable to check token existance.');
    }
  }

  async addRefreshToken(token) {
    try {
      async function insertToken(db, token) {
        db.run(
          'INSERT INTO refresh_tokens (token) VALUES (?)',
          [token],
          err => {
            if (err) {
              return console.error(err.message);
            }
          }
        );
      }
      const foundToken = await this.getToken(token);
      if (foundToken) {
        console.error('Refresh token already exits.');
        throw new Error('Refresh token already exits.');
      }

      await insertToken(this._db, token);
    } catch (error) {
      console.error('Unable to add refresh token: ', error);
    }
  }

  async addUser(username, password) {
    try {
      async function insertUser(db, username, password) {
        return new Promise((resolve, reject) => {
          db.run(
            'INSERT INTO users (username, password) VALUES (?, ?)',
            [username, password],
            function (err) {
              if (err) {
                console.error(err.message);
                reject(err);
              }
              resolve({ id: this.lastID, username, password });
            }
          );
        });
      }
      const foundUser = await this.getUser(username);
      if (foundUser) {
        console.error('User already exits.');
        throw new Error('User already exits.');
      }

      const newUser = await insertUser(this._db, username, password);
      return newUser;
    } catch (error) {
      console.error('Unable to add new user: ', error);
    }
  }

  async removeToken(token) {
    try {
      async function deleteToken(db, token) {
        db.run(
          'DELETE FROM refresh_tokens WHERE token = ?',
          [token],
          function (err) {
            if (err) {
              return console.error(err.message);
            }
            console.log(`Removed refresh_token id : ${this.lastID}.`);
          }
        );
      }
      const foundToken = await this.getToken(token);
      if (!foundToken) {
        console.warn('Token no longer exists, aborting.');
        return;
      }

      await deleteToken(this._db, token);
    } catch (error) {
      console.error('Unable to delete refresh token: ', error);
    }
  }
}

module.exports = DatabaseService;
