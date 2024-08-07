# Use a base image with Node.js
FROM node:18-slim

# Install Python and other necessary packages
RUN apt-get update && \
    apt-get install -y python3 python3-pip python3-venv && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Set up working directory
WORKDIR /app

# Copy package.json and package-lock.json for npm
COPY package*.json ./

# Install Node.js dependencies
RUN npm install

# Copy the application code, excluding files specified in .dockerignore
COPY . .

# Create a virtual environment and install Python dependencies
RUN python3 -m venv /app/venv
RUN /app/venv/bin/pip install -r requirements.txt

# Build the Node.js application
RUN npm run build

# Expose any ports your app uses (adjust as necessary)
EXPOSE 3000  # Change this if your app uses a different port

# Run the application using the virtual environment's Python
CMD ["/app/venv/bin/python", "runner.py"]
