# Use the official Node.js 14 image as base
FROM node:20

# Set the working directory in the container
WORKDIR /index

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code to the working directory
COPY . .

# Expose port 5000
EXPOSE 5000

# Command to run your Node.js application
CMD ["npm", "start"]
