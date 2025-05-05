# Use official Node.js 20 image
FROM node:20

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package.json yarn.lock* package-lock.json* ./
RUN yarn install --frozen-lockfile || npm install

# Copy all source files
COPY . .

# Build the Next.js app
RUN yarn build

# Expose port (usually 3000)
EXPOSE 3000

# Start the Next.js server
CMD ["yarn", "start"]
