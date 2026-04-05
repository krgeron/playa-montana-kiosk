# Stage 1: Build the React frontend
FROM node:22-alpine AS frontend-builder
WORKDIR /frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Production backend + built frontend
FROM node:22-alpine AS production
WORKDIR /app
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev
COPY backend/ ./
# Copy the built frontend into the backend's public directory
COPY --from=frontend-builder /frontend/dist ./public
EXPOSE 3004
CMD ["node", "src/index.js"]
