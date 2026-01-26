# Dockerfile for @massivoto/applet-confirm
# Build context: monorepo root (C:/code/nik/platform)
#
# Build command (from monorepo root):
#   docker build -t massivoto/applet-confirm:latest -f applets/confirm/Dockerfile .
#
# Run command:
#   docker run -p 3000:3000 --rm massivoto/applet-confirm:latest

FROM node:22-alpine

# Create app directory
WORKDIR /app

# Copy monorepo package files for workspace resolution
COPY package.json yarn.lock ./

# Copy workspace packages needed by this applet
COPY packages/kit/package.json ./packages/kit/
COPY applets/confirm/package.json ./applets/confirm/

# Install dependencies using yarn workspaces
RUN yarn install --production --ignore-scripts

# Copy built kit package
COPY packages/kit/dist/ ./packages/kit/dist/

# Copy built applet (backend + frontend)
COPY applets/confirm/dist/ ./applets/confirm/dist/

# Set working directory to applet
WORKDIR /app/applets/confirm

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start application
CMD ["node", "dist/docker-entry.js"]
