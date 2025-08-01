let accessToken = null;
let refreshToken = null;
const API_BASE_URL = CONFIG.API_BASE_URL;

// Ocultar chat al cargar y verificar auto-login
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("chat-section").classList.add("hidden");
  
  // Verificar si viene del registro con tokens temporales
  const tempAccessToken = localStorage.getItem('tempAccessToken');
  const tempRefreshToken = localStorage.getItem('tempRefreshToken');
  const autoLoginUsername = localStorage.getItem('autoLoginUsername');
  
  if (tempAccessToken && tempRefreshToken && autoLoginUsername) {
    // Limpiar storage temporal
    localStorage.removeItem('tempAccessToken');
    localStorage.removeItem('tempRefreshToken');
    localStorage.removeItem('autoLoginUsername');
    
    // Configurar tokens y mostrar chat
    accessToken = tempAccessToken;
    refreshToken = tempRefreshToken;
    
    // Mostrar mensaje de bienvenida
    const loginMessage = document.getElementById("login-message");
    loginMessage.textContent = `¡Bienvenido ${autoLoginUsername}! Tu cuenta ha sido creada exitosamente.`;
    loginMessage.className = "success";
    
    // Ocultar login y mostrar chat
    setTimeout(() => {
      document.getElementById("login-section").classList.add("hidden");
      document.getElementById("chat-section").classList.remove("hidden");
      
      // Mensaje de bienvenida en el chat
      addMessage(`Hello ${autoLoginUsername}! Your account has been created successfully. Welcome to our Pet Accessories Store! 🐾 I'm excited to help you find amazing products for your pet. What can I help you with today?`, "bot-message");
    }, 2000);
  }
});

// LOGIN
document.getElementById("login-btn").addEventListener("click", async () => {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const loginMessage = document.getElementById("login-message");
  loginMessage.textContent = "";

  try {
    const res = await fetch(`${API_BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      loginMessage.textContent = "Invalid username or password";
      return;
    }

    const data = await res.json();
    accessToken = data.accessToken;
    refreshToken = data.refreshToken;

    document.getElementById("login-section").classList.add("hidden");
    document.getElementById("chat-section").classList.remove("hidden");
    
    // Mensaje de bienvenida automático en inglés
    setTimeout(() => {
      addMessage("Hello! Welcome to our Pet Accessories Store! 🐾 I'm here to help you find the perfect products for your furry friend. How can I assist you today?", "bot-message");
    }, 500);
  } catch (err) {
    loginMessage.textContent = "Error connecting to server";
  }
});

// REFRESH TOKEN
async function refreshAccessToken() {
  try {
    const res = await fetch(`${API_BASE_URL}/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      throw new Error("Failed to refresh token");
    }

    const data = await res.json();
    accessToken = data.accessToken;
  } catch (err) {
    addMessage("Session expired. Please login again.", "bot-message");
    logout();
  }
}

// SEND MESSAGE
async function sendChatMessage() {
  const message = document.getElementById("chat-message").value;
  if (!message.trim()) return;

  addMessage(message, "user-message");
  document.getElementById("chat-message").value = "";

  try {
    let res = await fetch(`${API_BASE_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ question: message }),
    });

    // Si el token expiró, intenta refrescar y reintenta
    if (res.status === 401) {
      await refreshAccessToken();
      res = await fetch(`${API_BASE_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ question: message }),
      });
    }

    const data = await res.json();
    addMessage(data.answer || "No response from bot", "bot-message");
  } catch (err) {
    addMessage("Error contacting chatbot", "bot-message");
  }
}

document.getElementById("send-btn").addEventListener("click", sendChatMessage);

// Permitir enviar con Enter
document
  .getElementById("chat-message")
  .addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  });

// LOGOUT
document.getElementById("logout-btn").addEventListener("click", logout);

async function logout() {
  try {
    await fetch(`${API_BASE_URL}/logout`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: refreshToken }),
    });
  } catch (err) {
    console.error("Error during logout", err);
  }

  accessToken = null;
  refreshToken = null;
  document.getElementById("chat-section").classList.add("hidden");
  document.getElementById("login-section").classList.remove("hidden");
}

function addMessage(text, className) {
  const chatBox = document.getElementById("chat-box");
  const msgDiv = document.createElement("div");
  msgDiv.textContent = text;
  msgDiv.classList.add("message", className);
  chatBox.appendChild(msgDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// RESET PASSWORD FUNCTIONALITY - Simplificado
document.getElementById("forgot-password-link").addEventListener("click", (e) => {
  e.preventDefault();
  document.getElementById("login-section").classList.add("hidden");
  document.getElementById("reset-password-section").classList.remove("hidden");
});

document.getElementById("back-to-login-link").addEventListener("click", (e) => {
  e.preventDefault();
  document.getElementById("reset-password-section").classList.add("hidden");
  document.getElementById("login-section").classList.remove("hidden");
  // Limpiar formulario de reset
  document.getElementById("reset-username").value = "";
  document.getElementById("new-password").value = "";
  document.getElementById("confirm-password").value = "";
  document.getElementById("reset-message").textContent = "";
});

// Validación en tiempo real para habilitar/deshabilitar el botón
function validateResetForm() {
  const username = document.getElementById("reset-username").value.trim();
  const newPassword = document.getElementById("new-password").value;
  const confirmPassword = document.getElementById("confirm-password").value;
  const resetBtn = document.getElementById("reset-password-btn");
  const resetMessage = document.getElementById("reset-message");
  
  // Limpiar mensajes previos
  resetMessage.textContent = "";
  resetMessage.className = "";
  
  // Validaciones específicas con mensajes
  if (username.length > 0 && username.length < 3) {
    resetMessage.textContent = "El nombre de usuario debe tener al menos 3 caracteres";
    resetMessage.className = "error";
  }
  
  if (newPassword.length > 0 && newPassword.length < 6) {
    resetMessage.textContent = "La contraseña debe tener al menos 6 caracteres";
    resetMessage.className = "error";
  }
  
  if (newPassword.length >= 6 && !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
    resetMessage.textContent = "La contraseña debe contener mayúscula, minúscula y número";
    resetMessage.className = "error";
  }
  
  if (confirmPassword.length > 0 && newPassword !== confirmPassword) {
    resetMessage.textContent = "Las contraseñas no coinciden";
    resetMessage.className = "error";
  }
  
  // Mostrar mensaje de éxito cuando todo esté correcto
  const isValid = username.length >= 3 && 
                  newPassword.length >= 6 && 
                  confirmPassword === newPassword &&
                  /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword);
  
  if (isValid) {
    resetMessage.textContent = "✓ Todos los campos son válidos";
    resetMessage.className = "success";
  }
  
  resetBtn.disabled = !isValid;
}

// Agregar listeners para validación en tiempo real
document.getElementById("reset-username").addEventListener("input", validateResetForm);
document.getElementById("new-password").addEventListener("input", validateResetForm);
document.getElementById("confirm-password").addEventListener("input", validateResetForm);

// Validar y cambiar contraseña directamente
document.getElementById("reset-password-btn").addEventListener("click", async () => {
  const username = document.getElementById("reset-username").value.trim();
  const newPassword = document.getElementById("new-password").value;
  const confirmPassword = document.getElementById("confirm-password").value;
  const resetMessage = document.getElementById("reset-message");

  // Validaciones
  if (!username) {
    resetMessage.textContent = "Por favor ingresa tu nombre de usuario";
    resetMessage.className = "error";
    return;
  }

  if (!newPassword) {
    resetMessage.textContent = "Por favor ingresa la nueva contraseña";
    resetMessage.className = "error";
    return;
  }

  if (newPassword !== confirmPassword) {
    resetMessage.textContent = "Las contraseñas no coinciden";
    resetMessage.className = "error";
    return;
  }

  if (newPassword.length < 6) {
    resetMessage.textContent = "La contraseña debe tener al menos 6 caracteres";
    resetMessage.className = "error";
    return;
  }

  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
    resetMessage.textContent = "La contraseña debe contener mayúscula, minúscula y número";
    resetMessage.className = "error";
    return;
  }

  const resetBtn = document.getElementById("reset-password-btn");
  resetBtn.disabled = true;
  resetBtn.textContent = "Cambiando...";

  try {
    console.log('Enviando request a:', `${API_BASE_URL}/reset-password`);
    console.log('Con datos:', { username, newPassword: '***' });
    
    const response = await fetch(`${API_BASE_URL}/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, newPassword }),
    });

    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', data);

    if (data.success) {
      resetMessage.textContent = data.message + ' Redirigiendo al login...';
      resetMessage.className = "success";
      
      setTimeout(() => {
        document.getElementById("back-to-login-link").click();
      }, 2000);
    } else {
      resetMessage.textContent = data.message || 'Error al cambiar contraseña';
      resetMessage.className = "error";
    }
  } catch (error) {
    console.error('Error en reset password:', error);
    resetMessage.textContent = 'Error de conexión. Intenta nuevamente.';
    resetMessage.className = "error";
  } finally {
    resetBtn.disabled = false;
    resetBtn.textContent = "Cambiar Contraseña";
  }
});
