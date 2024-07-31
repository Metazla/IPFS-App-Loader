# Stage 1: Build the TypeScript application
FROM node:lts as builder

# Set up Yarn Modern (Yarn 2/Berry)
RUN npm install -g corepack
RUN corepack enable

# Set working directory and copy necessary files for installation
WORKDIR /app
COPY package.json ./
COPY .yarnrc.yml ./

# Install dependencies
RUN yarn install

# Copy source files
COPY ./src ./src
COPY ./*.json ./
COPY ./*.ts ./
COPY ./*.html ./
COPY ./*.cjs ./

# Build the application
RUN yarn build

# Stage 2: Serve the application with Nginx
FROM nginx:latest

# Copy built files from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html