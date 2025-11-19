#!/bin/bash

# Script to manage Docker Compose services

if [ "$1" == "start" ]; then
    # Launch the backend and frontend using Docker Compose
    docker-compose up --build -d

    # Give Docker a moment to settle
    sleep 1

    # Show the running services and their published localhost addresses (if any)
    ids=$(docker-compose ps -q)
    if [ -z "$ids" ]; then
        echo "No containers found."
    else
        echo "Published ports:"
        for id in $ids; do
            svc=$(docker inspect -f '{{index .Config.Labels "com.docker.compose.service"}}' "$id" 2>/dev/null)
            # Format: "80/tcp=0.0.0.0:8000" or "80/tcp=unmapped"
            ports=$(docker inspect -f '{{range $p,$conf := .NetworkSettings.Ports}}{{if $conf}}{{printf "%s=%s:%s\n" $p (index $conf 0).HostIp (index $conf 0).HostPort}}{{else}}{{printf "%s=unmapped\n" $p}}{{end}}{{end}}' "$id" 2>/dev/null)

            if [ -z "$ports" ]; then
                echo "  $svc: no published ports"
                continue
            fi

            echo "  $svc:"
            while IFS= read -r line; do
                protoport=${line%%=*}
                mapping=${line#*=}
                if [ "$mapping" = "unmapped" ] || [ -z "$mapping" ]; then
                    echo "    $protoport -> unmapped"
                else
                    hostip=${mapping%%:*}
                    hostport=${mapping##*:}
                    if [ "$hostip" = "0.0.0.0" ] || [ "$hostip" = "127.0.0.1" ] || [ -z "$hostip" ]; then
                        echo "    $protoport -> http://localhost:$hostport"
                    else
                        echo "    $protoport -> http://$hostip:$hostport"
                    fi
                fi
            done <<< "$ports"
        done
    fi
elif [ "$1" == "stop" ]; then
    # Stop and clean up Docker Compose services
    docker-compose down --volumes --remove-orphans
else
    # Display help section
    echo "Usage: $0 {start|stop}"
    echo "start - Launch the backend and frontend using Docker Compose"
    echo "stop  - Stop and clean up Docker Compose services"
fi