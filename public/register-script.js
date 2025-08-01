// Validaciones en tiempo real
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirm-password');
const registerBtn = document.getElementById('register-btn');
const registerMessage = document.getElementById('register-message');

// Función para validar nombre de usuario
function validateUsername(username) {
  if (!username) {
    return { valid: false, message: "El nombre de usuario es requerido" };
  }
  if (username.length < 3) {
    return { valid: false, message: "El nombre de usuario debe tener al menos 3 caracteres" };
  }
  if (username.length > 20) {
    return { valid: false, message: "El nombre de usuario no puede tener más de 20 caracteres" };
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return { valid: false, message: "Solo letras, números y guiones bajos permitidos" };
  }
  return { valid: true };
}

// Función para validar contraseña
function validatePassword(password) {
  if (!password) {
    return { valid: false, message: "La contraseña es requerida" };
  }
  if (password.length < 6) {
    return { valid: false, message: "La contraseña debe tener al menos 6 caracteres" };
  }
  if (password.length > 50) {
    return { valid: false, message: "La contraseña no puede tener más de 50 caracteres" };
  }
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    return { valid: false, message: "Debe contener mayúscula, minúscula y número" };
  }
  return { valid: true };
}

// Función para mostrar mensajes de validación
function showValidationMessage(input, validation) {
  const existing = input.parentNode.querySelector('.validation-message');
  if (existing) {
    existing.remove();
  }
  
  if (!validation.valid) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'validation-message error';
    messageDiv.textContent = validation.message;
    input.parentNode.appendChild(messageDiv);
    input.classList.add('invalid');
  } else {
    input.classList.remove('invalid');
    input.classList.add('valid');
  }
}

// Validación en tiempo real para username
usernameInput.addEventListener('input', () => {
  const validation = validateUsername(usernameInput.value);
  showValidationMessage(usernameInput, validation);
  checkFormValidity();
});

// Validación en tiempo real para password
passwordInput.addEventListener('input', () => {
  const validation = validatePassword(passwordInput.value);
  showValidationMessage(passwordInput, validation);
  
  // También validar confirmación si hay algo
  if (confirmPasswordInput.value) {
    validatePasswordConfirmation();
  }
  checkFormValidity();
});

// Validación para confirmar contraseña
function validatePasswordConfirmation() {
  const password = passwordInput.value;
  const confirmPassword = confirmPasswordInput.value;
  
  if (!confirmPassword) {
    showValidationMessage(confirmPasswordInput, { valid: false, message: "Confirma tu contraseña" });
    return false;
  }
  
  if (password !== confirmPassword) {
    showValidationMessage(confirmPasswordInput, { valid: false, message: "Las contraseñas no coinciden" });
    return false;
  }
  
  showValidationMessage(confirmPasswordInput, { valid: true });
  return true;
}

confirmPasswordInput.addEventListener('input', () => {
  validatePasswordConfirmation();
  checkFormValidity();
});

// Función para verificar si el formulario es válido
function checkFormValidity() {
  const usernameValid = validateUsername(usernameInput.value).valid;
  const passwordValid = validatePassword(passwordInput.value).valid;
  const confirmValid = confirmPasswordInput.value === passwordInput.value && confirmPasswordInput.value !== '';
  
  registerBtn.disabled = !(usernameValid && passwordValid && confirmValid);
}

// Manejar el registro
registerBtn.addEventListener('click', async () => {
  const username = usernameInput.value.trim();
  const password = passwordInput.value;
  const confirmPassword = confirmPasswordInput.value;

  // Validaciones finales
  const usernameValidation = validateUsername(username);
  const passwordValidation = validatePassword(password);

  if (!usernameValidation.valid) {
    registerMessage.textContent = usernameValidation.message;
    registerMessage.className = 'error';
    return;
  }

  if (!passwordValidation.valid) {
    registerMessage.textContent = passwordValidation.message;
    registerMessage.className = 'error';
    return;
  }

  if (password !== confirmPassword) {
    registerMessage.textContent = 'Las contraseñas no coinciden';
    registerMessage.className = 'error';
    return;
  }

  registerBtn.disabled = true;
  registerBtn.textContent = 'Creando cuenta...';

  try {
    const response = await fetch(`${CONFIG.API_BASE_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      registerMessage.textContent = '¡Cuenta creada exitosamente! Iniciando sesión...';
      registerMessage.className = 'success';
      
      // Automaticamente hacer login después del registro exitoso
      setTimeout(async () => {
        try {
          const loginResponse = await fetch(`${CONFIG.API_BASE_URL}/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
          });

          if (loginResponse.ok) {
            const loginData = await loginResponse.json();
            // Guardar tokens en localStorage para transferir a la página principal
            localStorage.setItem('tempAccessToken', loginData.accessToken);
            localStorage.setItem('tempRefreshToken', loginData.refreshToken);
            localStorage.setItem('autoLoginUsername', username);
            
            registerMessage.textContent = '¡Bienvenido! Redirigiendo al chat...';
            
            setTimeout(() => {
              window.location.href = '/';
            }, 1000);
          } else {
            registerMessage.textContent = '¡Cuenta creada! Ve al login para ingresar.';
            setTimeout(() => {
              window.location.href = '/';
            }, 2000);
          }
        } catch (error) {
          registerMessage.textContent = '¡Cuenta creada! Ve al login para ingresar.';
          setTimeout(() => {
            window.location.href = '/';
          }, 2000);
        }
      }, 1500);
    } else {
      registerMessage.textContent = data.message || 'Error al crear la cuenta';
      registerMessage.className = 'error';
    }
  } catch (error) {
    registerMessage.textContent = 'Error de conexión. Intenta nuevamente.';
    registerMessage.className = 'error';
  } finally {
    registerBtn.disabled = false;
    registerBtn.textContent = 'Crear Cuenta';
  }
});

// Inicializar estado del botón
checkFormValidity();
