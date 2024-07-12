# Use the official Python image from the Docker Hub
FROM python:3.11.7-slim

# Set the working directory in the container
WORKDIR /src

# Install necessary dependencies
RUN apt-get update && apt-get install -y \
    libjpeg-dev \
    libtiff-dev \
    libsdl1.2-dev \
    libsdl-image1.2-dev \
    libsdl-mixer1.2-dev \
    libsdl-ttf2.0-dev \
    libsmpeg-dev \
    libportmidi-dev \
    libavformat-dev \
    libswscale-dev \
    libv4l-dev \
    libxvidcore-dev \
    libx264-dev \
    x264 \
    libgtk-3-dev \
    libatlas-base-dev \
    gfortran \
    build-essential \
    libespeak-dev \
    xvfb \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements.txt and install Python dependencies
COPY src/requirements.txt /src/requirements.txt
RUN pip install --no-cache-dir -r /src/requirements.txt

# Copy the rest of the application code to the working directory
COPY src /src

# Make port 8080 available to the world outside this container
EXPOSE 8080

# Run bot.py with Xvfb when the container launches
CMD ["python", "bot.py"]
