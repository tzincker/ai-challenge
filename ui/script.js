let accessToken = null;
let refreshToken = null;
const API_BASE_URL = "http://localhost:3000";

// Ocultar chat al cargar
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("chat-section").classList.add("hidden");
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
document.getElementById("send-btn").addEventListener("click", async () => {
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
      body: JSON.stringify({ message }),
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
        body: JSON.stringify({ message }),
      });
    }

    const data = await res.json();
    addMessage(data.reply || "No response from bot", "bot-message");
  } catch (err) {
    addMessage("Error contacting chatbot", "bot-message");
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
