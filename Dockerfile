FROM node:18

# Establecer carpeta de trabajo para el backend
WORKDIR /api

# Copiar archivos necesarios
COPY api/package*.json ./
RUN npm install

# Copiar código fuente backend
COPY api/src ./src

# Copiar frontend completo dentro de la imagen en /api/ui
COPY ui ./ui

# Exponer puerto donde corre el backend
EXPOSE 3000

# Iniciar servidor backend
CMD ["node", "src/index.js"]
