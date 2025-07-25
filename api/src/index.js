const express = require('express');
const app = express();
const port = 3000;

const jwt = require("jsonwebtoken");

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.post('/login', (req, res) => {

  const username = req.body.username;

  res.send('Hello World!');
});

app.get('/chat', (req, res) => {
  res.send('this is chat!');
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
