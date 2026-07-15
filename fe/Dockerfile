# ====================== BUILD ======================
FROM node:24-alpine AS build

ARG VITE_API_URL=http://localhost:8080
ENV VITE_API_URL=${VITE_API_URL}

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ====================== RUNTIME ======================
FROM node:24-alpine

WORKDIR /app

COPY --from=build /app/dist ./dist
RUN npm install -g serve

EXPOSE 3000

CMD ["serve", "dist", "-l", "3000", "--no-clipboard"]
