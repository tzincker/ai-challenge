FROM node:18

# Establecer carpeta de trabajo para el backend
WORKDIR /api

# Copiar archivos de package.json y package-lock.json del backend
COPY api/package*.json ./

# Instalar dependencias backend
RUN npm install

# Copiar código backend
COPY api/src ./src

# Copiar frontend completo dentro de la imagen
COPY ui ./ui

# Exponer puerto donde corre la app
EXPOSE 3000

# Comando para iniciar backend
CMD ["node", "src/index.js"]