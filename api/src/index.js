const express = require("express");
const cors = require("cors");
const path = require("path"); // Importante para manejar rutas
const app = express();
const port = process.env.PORT || 3000;
const UserService = require("./services/UserService");
const userService = new UserService();
app.use(cors());
app.use(express.json());
// Servir archivos estáticos desde la carpeta 'ui'
const uiPath = path.join(__dirname, "public");
app.use(express.static(uiPath));
//Error: ENOENT: no such file or directory, stat '/usr/src/app/src/ui/index.html'
//C:\Users\denf\workspace\IAPOC\api\ui\index.html


// Middleware para validar token JWT
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
  req.user = result; // Asignamos el usuario decodificado al request
  next();
}
// Ruta raíz que sirve el index.html sin autenticación
app.get("/", (req, res) => {
  res.sendFile(path.join(uiPath, "index.html"));
});
// Ruta de login
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const { accessToken, refreshToken } = await userService.login(username, password);
  if (!accessToken) {
    return res.status(401).json({ message: "Invalid credentials" });
  }
  res.json({ accessToken, refreshToken });
});
// Ruta para refrescar token
app.post("/token", (req, res) => {
  const { refreshToken } = req.body || {};
  if (!refreshToken) {
    return res.sendStatus(403);
  }
  const result = userService.refreshToken(refreshToken);
  if (!result) {
    return res.sendStatus(403);
  }
  const { accessToken } = result;
  res.json({ accessToken });
});
// Ruta para logout
app.delete("/logout", (req, res) => {
  const { token } = req.body;
  userService.logout(token);
  res.sendStatus(204);
});
// Ruta protegida de chat (requiere token)
app.post("/chat", authenticateToken, (req, res) => {
  // Aquí iría la lógica del chatbot
  res.send("this is chat!");
});
// Iniciar servidor
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
