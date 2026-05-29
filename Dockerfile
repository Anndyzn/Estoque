FROM node:20-bookworm

WORKDIR /app

COPY package*.json ./

RUN npm install --build-from-source=sqlite3

COPY . .

EXPOSE 4000

CMD ["npm", "start"]