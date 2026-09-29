# ARG NODE_VERSION=26.7.0-alpine3.23

# FROM node:${NODE_VERSION}

# WORKDIR /app

# COPY package*.json ./

# RUN npm ci

# COPY . .

# EXPOSE 8000

# CMD ["npm", "run", "dev"]

ARG NODE_VERSION=26.7.0-alpine3.23

FROM node:${NODE_VERSION}

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

EXPOSE 8000

CMD ["sh", "-c", "npm run db:migrate && npm start"]