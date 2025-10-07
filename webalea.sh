#!/bin/bash

# Script to manage Docker Compose services

if [ "$1" == "start" ]; then
    # Launch the backend and frontend using Docker Compose
    docker-compose up --build -d
elif [ "$1" == "stop" ]; then
    # Stop and clean up Docker Compose services
    docker-compose down --volumes --remove-orphans
else
    # Display help section
    echo "Usage: $0 {start|stop}"
    echo "start - Launch the backend and frontend using Docker Compose"
    echo "stop  - Stop and clean up Docker Compose services"
fi