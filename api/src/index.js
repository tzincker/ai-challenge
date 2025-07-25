const express = require('express');
const app = express();
const port = 3000;

//process.loadEnvFile();

const jwt = require("jsonwebtoken");

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.post('/login', (req, res) => {

  const username = req.body.username;
  const user = { username };
  const secret = process.env.ACCESS_TOKEN_SECRET;
  const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET);

  res.json({ accessToken });
});

app.get('/chat', (req, res) => {
  res.send('this is chat!');
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
