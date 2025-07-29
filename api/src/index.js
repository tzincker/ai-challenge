const express = require('express');
const app = express();
const port = 3000;

const UserService = require('./services/UserService');

app.use(express.json());

const userService = new UserService();

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    console.error("Invalid token!");
    return res.sendStatus(401);
  }

  const result = userService.verify(token);
  if (result === 403) {
    return res.sendStatus(403);
  }
  req.user = result;
  next();
}

app.get('/', authenticateToken, (req, res) => {
  res.send('Hello World!');
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const { accessToken, refreshToken } = await userService.login(username, password);
  if (accessToken === null) {
    return res.sendStatus(401);
  }
  res.json({ accessToken, refreshToken });
});

app.post('/token', async (req, res) => {
  const { refreshToken } = req.body || {};
  if (!refreshToken) {
    return res.sendStatus(401);
  }

  const result = userService.refreshToken(refreshToken);
  if (result === 403) {
    res.sendStatus(403);
  }

  const { accessToken } = result;
  res.json({ accessToken });
});

app.delete("/logout", (req, res) => {
  const { token } = req.body;
  userService.logout(token);
  return res.sendStatus(204);
});

app.post('/chat', (req, res) => {
  res.send('this is chat!');
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
