# 🐳 Dockerfile optimizado para Azure Container Apps
FROM node:18

# Crear directorio de la aplicación
WORKDIR /usr/src/app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias y recompilar módulos nativos
RUN npm ci --only=production
RUN npm rebuild sqlite3

# Copiar código fuente (excluyendo node_modules)
COPY . .

# Exponer puerto
EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["node", "src/index.js"]