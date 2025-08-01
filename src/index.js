/* c8 ignore file */
const express = require("express");
const cors = require("cors");
const path = require("path"); // Importante para manejar rutas
const bodyParser = require('body-parser')
const app = express();
const port = process.env.PORT || 3000;

// 📄 Configuración con SQLite persistente
const SQLiteDatabaseService = require("./services/SQLiteDatabaseService");
const databaseService = new SQLiteDatabaseService();
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
    console.error("No token provided!");
    return res.status(401).json({ error: "Token requerido" });
  }
  
  const result = userService.verify(token);
  if (!result) {
    console.error("Invalid or expired token!");
    return res.status(403).json({ error: "Token inválido o expirado" });
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
  const result = await userService.login(username, password);
  
  if (!result || !result.accessToken) {
    return res.status(401).json({ message: "Invalid credentials" });
  }
  
  res.json({ accessToken: result.accessToken, refreshToken: result.refreshToken });
});
// Ruta de register
app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  const result = await userService.register(username, password);

  if (!result.success) {
    return res.status(400).json({ message: result.message });
  }

  res.json({ success: true, message: result.message });
});

// Ruta para solicitar reset de password
app.post("/request-password-reset", async (req, res) => {
  const { username } = req.body;
  
  if (!username) {
    return res.status(400).json({ message: "El nombre de usuario es requerido" });
  }

  const result = await userService.requestPasswordReset(username);
  res.json(result);
});

// Ruta para resetear password
app.post("/reset-password", async (req, res) => {
  const { username, newPassword } = req.body;
  
  if (!username || !newPassword) {
    return res.status(400).json({ 
      message: "Se requieren nombre de usuario y nueva contraseña" 
    });
  }

  const result = await userService.resetPassword(username, newPassword);
  
  if (!result.success) {
    return res.status(400).json({ message: result.message });
  }

  res.json(result);
});

// Ruta para refrescar token
app.post("/token", async (req, res) => {
  const { refreshToken } = req.body || {};
  if (!refreshToken) {
    return res.sendStatus(403);
  }
  
  const result = await userService.refreshToken(refreshToken);
  
  // 🔄 MEJORA: Manejar nuevos formatos de error
  if (result.error) {
    return res.status(result.status || 403).json({ error: result.error });
  }
  
  if (!result.accessToken) {
    return res.sendStatus(403);
  }
  
  res.json({ accessToken: result.accessToken });
});
// Ruta para logout
app.delete("/logout", async (req, res) => {
  const { token } = req.body;
  await userService.logout(token);
  res.sendStatus(204);
});
// Ruta protegida de chat
app.use("/chat", authenticateToken, chatService.getRouter());

// 🚀 Iniciar servidor con inicialización de base de datos
async function startServer() {
  try {
    // Inicializar base de datos
    await databaseService.connect();
    await databaseService.initializeTables();
    
    // Crear usuarios de prueba si no existen
    await createTestUsers();
    
    app.listen(port, () => {
      console.log(`🚀 Server listening on port ${port}`);
      console.log(`📱 Frontend: http://localhost:${port}`);
      console.log(`📝 Register: http://localhost:${port}/register`);
    });
  } catch (error) {
    console.error('❌ Error starting server:', error);
    process.exit(1);
  }
}

// Crear usuarios de prueba
async function createTestUsers() {
  const bcrypt = require('bcrypt');
  const testUsers = [
    { username: 'user1', password: 'Password123' },
    { username: 'user2', password: 'Password123' },
    { username: 'admin', password: 'Admin123' },
    { username: 'test', password: 'Test123' }
  ];

  for (const user of testUsers) {
    try {
      const existingUser = await databaseService.getUser(user.username);
      if (!existingUser) {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        await databaseService.addUser(user.username, null, hashedPassword);
        console.log(`✅ Usuario de prueba creado: ${user.username}`);
      }
    } catch (error) {
      console.log(`ℹ️ Usuario ${user.username} ya existe o error: ${error.message}`);
    }
  }
}

startServer();
