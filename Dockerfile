FROM node:16.19-alpine3.17 AS build
WORKDIR /app
COPY functions/ ./
RUN npm ci && npm run build

FROM node:16.19-alpine3.17 AS prod
WORKDIR /app
COPY package*.json .
RUN npm install --omit=dev && npm install -g pm2
RUN apk update && apk add chromium
COPY from=build /app/lib/ ./lib/
ENTRYPOINT ["pm2-runtime", "lib/index.js"]