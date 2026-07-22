FROM node:22.22.3-alpine3.24 AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:22.22.3-alpine3.24
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json* ./
RUN npm install --omit=dev
COPY --from=build /app/dist ./dist
EXPOSE 3002
# CHANGE THIS IN PRODUCTION TO GAME.BLASTWAVE.SPACE
ENV API_SERVER=5.78.184.148
ENV API_PORT=1338
CMD ["node", "dist/index.js"]
