# -------- Stage 1: Build --------
FROM node:18-alpine AS builder
WORKDIR /app

# Install dependencies first for better cache utilisation
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Copy the rest of the source
COPY . .

# Set environment variables for production build
ENV NODE_ENV=production
ENV EXPO_PUBLIC_BACKEND_URL=https://agentlog.scalebase.io
ENV EXPO_PUBLIC_ENVIRONMENT=production

# Build static web files using Expo
RUN npx expo export --platform web --output-dir dist

# -------- Stage 2: Runtime --------
FROM nginx:alpine

# Copy build output to nginx html folder
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"] 