#!/bin/bash
# Script to manage Docker Compose services on Linux/Mac

ARG=$1

if [ "$ARG" == "start" ]; then
    # Launch the backend and frontend using Docker Compose
    docker compose build
    docker compose up -d

    # Give Docker a moment to settle
    sleep 1

    # Show the running services and their published localhost addresses
    echo ""
    echo "Running services:"
    echo "================"

    for container_id in $(docker compose ps -q); do
        container_name=$(docker inspect -f "{{.Name}}" "$container_id")
        echo "$container_name:"

        docker port "$container_id" | grep "0.0.0.0" | while read -r line; do
            container_port=$(echo "$line" | awk '{print $1}')
            host_port=$(echo "$line" | awk -F ':' '{print $2}')
            echo "  $container_port -> http://localhost:$host_port"
        done

        echo ""
    done

elif [ "$ARG" == "stop" ]; then
    # Stop and clean up Docker Compose services
    docker compose pause

elif [ "$ARG" == "clean-volumes" ]; then
    # Stop and clean up Docker Compose services
    docker compose down --volumes

elif [ "$ARG" == "clean-containers" ]; then
    # Stop and clean up Docker Compose services
    docker compose down --remove-orphans

elif [ "$ARG" == "clean" ]; then
    # Stop and clean up Docker Compose services
    docker compose down --volumes --remove-orphans

else
    # Display help section
    echo "Usage: $0 {start|stop|clean-volumes|clean-containers|clean}"
    echo "start - Launch the backend and frontend using Docker Compose"
    echo "stop  - Stop and clean up Docker Compose services"
    echo "clean-volumes - Delete volume => reset volumes env"
    echo "clean-containers - Delete container => reset containers env"
    echo "clean - Delete volume and container => reset docker env"
fi