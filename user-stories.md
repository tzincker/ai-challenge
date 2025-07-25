# User Stories - Chatbot de Tienda Online de Accesorios de Mascotas

## Historia 1: Registro de Usuario

**Persona:**  
Como **nuevo cliente** de la tienda online.

**Historia:**  
Quiero **crear una cuenta con mi email y contraseña**  
Para **poder iniciar sesión y acceder al chatbot**.

**Beneficio:**  
Tendré una experiencia personalizada y segura para consultar mis pedidos.

**Criterios de aceptación:**

- Debo poder enviar mi email y contraseña para registrarme.
- Recibir una respuesta confirmando el registro exitoso.
- No puedo registrarme si el email ya existe.

**Endpoint:**  
`POST /users/register`

---

## Historia 2: Inicio de Sesión

**Persona:**  
Como **usuario registrado**.

**Historia:**  
Quiero **iniciar sesión con mi email y contraseña**  
Para **poder usar el chatbot con mi cuenta**.

**Beneficio:**  
Asegura que solo usuarios registrados puedan acceder al servicio.

**Criterios de aceptación:**

- Puedo iniciar sesión con email y contraseña correctos.
- Recibo un token de autenticación (JWT).
- Recibo error si las credenciales no son correctas.

**Endpoint:**  
`POST /users/login`

---

## Historia 3: Acceso al Chatbot

**Persona:**  
Como **usuario autenticado**.

**Historia:**  
Quiero **enviar mensajes al chatbot**  
Para **recibir ayuda con preguntas sobre los productos (disponibilidad, características, precios)**.

**Beneficio:**  
Obtengo respuestas rápidas sin necesidad de contactar al soporte humano.

**Criterios de aceptación:**

- Debo enviar un token válido para acceder al endpoint `/chat`.
- Puedo enviar un mensaje y recibir una respuesta del chatbot.
- Recibo error si no estoy autenticado.

**Endpoint:**  
`POST /chat`

---

## Historia 4: Consulta de Productos en el Chatbot

**Persona:**  
Como **usuario que busca productos para mascotas**.

**Historia:**  
Quiero **hacer preguntas sobre productos específicos (por ejemplo, correas, camas, juguetes)**  
Para **decidir cuál comprar**.

**Beneficio:**  
Me ayuda a encontrar el producto correcto rápidamente.

**Criterios de aceptación:**

- Puedo preguntar algo como “¿Tienen camas para perros grandes?”
- El chatbot responde con información del catálogo (mock o KB).
- Si el producto no está disponible, se indica que no hay stock.

**Endpoint:**  
`POST /chat`

---

## Historia 5: Seguridad de Sesión

**Persona:**  
Como **usuario autenticado**.

**Historia:**  
Quiero **que mi sesión esté protegida**  
Para **asegurar que solo yo pueda acceder a mi información y al chat**.

**Beneficio:**  
Protege los datos de la cuenta y conversaciones.

**Criterios de aceptación:**

- El token expira después de un tiempo configurado (por ejemplo, 1h).
- Intentar usar un token inválido o expirado devuelve un error 401.

**Endpoint:**  
`(Middleware para JWT en /chat)`
