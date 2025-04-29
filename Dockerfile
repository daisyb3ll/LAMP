FROM node:18

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Port from server.js — Cloud Run uses $PORT env var
ENV PORT=3000
EXPOSE 3000

CMD ["npm", "start"]