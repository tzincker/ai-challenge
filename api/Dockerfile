FROM node:18

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

# Error: ENOENT: no such file or directory, stat '/usr/src/app/src/public/index.html'



EXPOSE 3000

CMD ["node", "src/index.js"]