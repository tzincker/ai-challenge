const express = require("express");
const cors = require("cors");
const path = require("path"); // Importante para manejar rutas
const bodyParser = require('body-parser')
const app = express();
const port = process.env.PORT || 3000;
const sqlite = require("sqlite3");
const db = new sqlite.Database(':memory:');

const DatabaseService = require("./services/DatabaseService");
const databaseService = new DatabaseService(db);
const UserService = require("./services/UserService");
const userService = new UserService(databaseService);
const ChatService = require("./services/ChatService");
const chatService = new ChatService();


app.set('views', './src/views');
app.set('view engine', 'pug');
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({extended: false}))

// Servir archivos estáticos desde la carpeta 'public'
const uiPath = path.join(__dirname, "..", "public");
app.use(express.static(uiPath));

// Middleware para validar token JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    console.error("Invalid token!");
    return res.sendStatus(401);
  }
  const result = userService._verify(token);
  if (result === 403) {
    return res.sendStatus(403);
  }
  req.user = result; // Asignamos el usuario decodificado al request
  next();
}
// Ruta raíz que sirve el index.html sin autenticación
app.get("/", (req, res) => {
  res.render("index.pug", { apiBaseUrl: process.env.API_BASE_URL });
});

app.get("/register", (req, res) => {
  res.render("register.pug", { apiBaseUrl: process.env.API_BASE_URL });
});

// Ruta de login
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const { accessToken, refreshToken } = await userService.login(
    username,
    password
  );
  if (!accessToken) {
    return res.status(401).json({ message: "Invalid credentials" });
  }
  res.json({ accessToken, refreshToken });
});
// Ruta de register
app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  const success = await userService.register(
    username,
    password
  );

  if (success === 303) {
    return res.sendStatus(303);
  }

  if (!success) {
    return res.status(400).json({ message: "Failed at registering user." });
  }
  res.redirect("/");
});

// Ruta para refrescar token
app.post("/token", async (req, res) => {
  const { refreshToken } = req.body || {};
  if (!refreshToken) {
    return res.sendStatus(403);
  }
  const result = await userService.refreshToken(refreshToken);
  if (!result) {
    return res.sendStatus(403);
  }
  const { accessToken } = result;
  res.json({ accessToken });
});
// Ruta para logout
app.delete("/logout", async (req, res) => {
  const { token } = req.body;
  await userService.logout(token);
  res.sendStatus(204);
});
// Ruta protegida de chat
app.use("/chat", authenticateToken, chatService.getRouter());
// Iniciar servidor
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
