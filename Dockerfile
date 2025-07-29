FROM node:18

WORKDIR /api

COPY api/package*.json ./

RUN npm install

COPY api/src/ ./src/

COPY ui/ ./ui/

EXPOSE 3000

CMD ["node", "src/index.js"]