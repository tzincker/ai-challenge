# User Stories - Pet Accessories Online Store Chatbot

## Story 1: User Registration

**Persona:**  
As a **new customer**,

**Story:**  
I want to **create an account with a username and password**  
So that I **can use the chatbot and manage my sessions**.

**Benefit:**  
I can access personalized features and chat securely.

**Acceptance Criteria:**

- I can register with a unique username and valid password.
- If the username already exists, I get an error.
- Registration is persisted in the SQLite database.

**Endpoint:**  
`POST /register`

---

## Story 2: User Login

**Persona:**  
As a **registered user**,

**Story:**  
I want to **log in with my username and password**  
So that I **can start a chat session with the bot**.

**Benefit:**  
It allows secure access to the chatbot with authentication.

**Acceptance Criteria:**

- I can log in with correct credentials and receive access & refresh tokens (JWT).
- Invalid credentials return a 401 error.
- Access token expires (e.g., 1h), refresh token can generate a new access token.

**Endpoint:**  
`POST /login`

---

## Story 3: Token Refresh & Logout

**Persona:**  
As an **authenticated user**,

**Story:**  
I want to **refresh my access token and log out securely**  
So that I **can maintain my session or end it when I want**.

**Benefit:**  
I don’t get logged out suddenly and can control my session lifecycle.

**Acceptance Criteria:**

- `POST /token` with a valid refresh token returns a new access token.
- Invalid or expired refresh token returns 403.
- `DELETE /logout` invalidates the refresh token.

**Endpoints:**

- `POST /token`
- `DELETE /logout`

---

## Story 4: Password Reset

**Persona:**  
As a **registered user who forgot my password**,

**Story:**  
I want to **request a password reset**  
So that I **can recover access to my account**.

**Benefit:**  
Ensures I can always recover my account without manual admin support.

**Acceptance Criteria:**

- `POST /request-password-reset` with username initiates reset.
- `POST /reset-password` with username & new password updates the credentials.
- Returns success message or error if user does not exist.

**Endpoints:**

- `POST /request-password-reset`
- `POST /reset-password`

---

## Story 5: Chatbot Product Queries

**Persona:**  
As a **user looking for pet accessories**,

**Story:**  
I want to **ask the chatbot about products, availability, and recommendations**  
So that I **can decide which product to buy quickly**.

**Benefit:**  
I get immediate product info without browsing manually.

**Acceptance Criteria:**

- I must include a valid access token in the Authorization header.
- I can ask “Do you have toys for cats?” and receive a meaningful response.
- The chatbot can respond with KB / mock catalog data.
- Invalid or expired token returns 401/403.

**Endpoint:**  
`POST /chat`
