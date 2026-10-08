ARG NODE_VERSION=26.7.0-alpine3.23

FROM node:${NODE_VERSION}

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

CMD ["npm", "start"]