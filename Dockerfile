# ==============================================================================
# Multi-Engine Production Docker Container
# Combines high-performance static Vite frontend assets, Node.js process supervisor, 
# and a Python 3.10 backend calculation / AI optimization engine.
# ==============================================================================

# --- Stage 1: Build & Compile Frontend Assets ---
FROM node:20-slim AS builder
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy full application context and build production static files & compiled server.cjs
COPY . .
RUN npm run build

# --- Stage 2: Minimal Production Runtime Assembly ---
FROM node:20-slim
WORKDIR /app

# Install lightweight Python 3 execution runtime
RUN apt-get update && apt-get install -y \
    python3 \
    && rm -rf /var/lib/apt/lists/*

# Copy production package manifest and install only mandatory runtime dependencies
COPY package*.json ./
RUN npm ci --only=production

# Bring over pre-compiled server.cjs and client-side distribution folder
COPY --from=builder /app/dist ./dist

# Bring over the primary Python backend modules
COPY --from=builder /app/server.py /app/providers_data.py ./

# Expose the single externally-routable container port
EXPOSE 3000
ENV NODE_ENV=production
ENV PORT=3000

# Fire up the Node.js process supervisor (starts server.ts / server.cjs to manage server.py)
CMD ["npm", "start"]
