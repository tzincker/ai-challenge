let token = null;
const API_BASE_URL = "http://localhost:3000";

// Asegurar que el chat esté oculto al cargar
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("chat-section").classList.add("hidden");
});

// LOGIN
document.getElementById("login-btn").addEventListener("click", async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const loginMessage = document.getElementById("login-message");

  loginMessage.textContent = "";

  try {
    const res = await fetch(`${API_BASE_URL}/users/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      loginMessage.textContent = "Invalid email or password";
      return;
    }

    const data = await res.json();
    token = data.token;

    // Mostrar chat y ocultar login
    document.getElementById("login-section").classList.add("hidden");
    document.getElementById("chat-section").classList.remove("hidden");
  } catch (err) {
    loginMessage.textContent = "Error connecting to server";
  }
});

// ENVIAR MENSAJE
document.getElementById("send-btn").addEventListener("click", async () => {
  const message = document.getElementById("chat-message").value;
  if (!message.trim()) return;

  if (!token) {
    addMessage("You must login before chatting.", "bot-message");
    return;
  }

  addMessage(message, "user-message");
  document.getElementById("chat-message").value = "";

  try {
    const res = await fetch(`${API_BASE_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ message }),
    });

    const data = await res.json();
    addMessage(data.reply || "No response from bot", "bot-message");
  } catch (err) {
    addMessage("Error contacting chatbot", "bot-message");
  }
});

// LOGOUT
document.getElementById("logout-btn").addEventListener("click", () => {
  token = null;
  document.getElementById("chat-section").classList.add("hidden");
  document.getElementById("login-section").classList.remove("hidden");
});

function addMessage(text, className) {
  const chatBox = document.getElementById("chat-box");
  const msgDiv = document.createElement("div");
  msgDiv.textContent = text;
  msgDiv.classList.add("message", className);
  chatBox.appendChild(msgDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}
