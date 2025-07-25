# Pet Accessories Online Store Chatbot

This project implements a **web service with a chatbot** for an online pet accessories store.  
The chatbot answers product-related questions, but only registered and authenticated users can access it.

## **Key Features**

- User registration (`POST /users/register`).
- Login with JWT authentication (`POST /users/login`).
- Protected `/chat` endpoint for chatbot interaction.
- Foundation to integrate a language model (LLM) or a knowledge base (simulated RAG).
- Simple architecture with **Node.js + Express**.

---

## **Prerequisites**

- Node.js >= 18
- npm or yarn

---

## **Installation**

```bash
# Clone the repository
git clone <repo-url>

# Install dependencies
npm install
```
