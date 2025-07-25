# User Stories - Pet Accessories Online Store Chatbot

## Story 1: Login

**Persona:**  
As a **registered user**,

**Story:**  
I want to **log in with my email and password**  
So that I **can use the chatbot with my account**.

**Benefit:**  
It ensures that only registered users can access the service.

**Acceptance Criteria:**

- I can log in with correct email and password.
- I receive an authentication token (JWT).
- I get an error if the credentials are incorrect.

**Endpoint:**  
`POST /users/login`

---

## Story 2: Chatbot Access

**Persona:**  
As an **authenticated user**,

**Story:**  
I want to **send messages to the chatbot**  
So that I **can get help with questions about the products (availability, features, prices)**.

**Benefit:**  
I get quick answers without needing to contact human support.

**Acceptance Criteria:**

- I must send a valid token to access the `/chat` endpoint.
- I can send a message and receive a response from the chatbot.
- I get an error if I’m not authenticated.

**Endpoint:**  
`POST /chat`

---

## Story 3: Product Queries via Chatbot

**Persona:**  
As a **user looking for pet accessories**,

**Story:**  
I want to **ask questions about specific products (e.g., leashes, beds, toys)**  
So that I **can decide which product to buy**.

**Benefit:**  
It helps me quickly find the right product.

**Acceptance Criteria:**

- I can ask something like “Do you have beds for large dogs?”
- The chatbot responds with information from the catalog (mock or KB).
- If the product is unavailable, it informs me about the out-of-stock status.

**Endpoint:**  
`POST /chat`

---

## Story 4: Session Security

**Persona:**  
As an **authenticated user**,

**Story:**  
I want **my session to be protected**  
So that I **can ensure only I can access my data and chat**.

**Benefit:**  
It protects account data and conversations.

**Acceptance Criteria:**

- The token expires after a configured time (e.g., 1h).
- Using an invalid or expired token returns a 401 error.

**Endpoint:**  
`(JWT middleware on /chat)`
