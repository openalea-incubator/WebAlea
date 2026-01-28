@echo off
SETLOCAL EnableDelayedExpansion
REM Script to manage Docker Compose services on Windows

SET ARG=%1

IF "%ARG%"=="start" (
    REM Launch the backend and frontend using Docker Compose
    docker compose build
    docker compose up -d

    REM Give Docker a moment to settle
    timeout /t 1 >nul

    REM Show the running services and their published localhost addresses
    ECHO.
    ECHO Running services:
    ECHO ================
    FOR /F "tokens=*" %%i IN ('docker compose ps -q') DO (
        FOR /F "tokens=*" %%n IN ('docker inspect -f "{{.Name}}" %%i') DO (
            SET CONTAINER_NAME=%%n
            ECHO !CONTAINER_NAME!:
        )
        FOR /F "tokens=1,3 delims= " %%a IN ('docker port %%i ^| findstr "0.0.0.0"') DO (
            FOR /F "tokens=2 delims=:" %%c IN ("%%b") DO (
                ECHO    -^> http://localhost:%%c
            )
        )
        ECHO.
    )
) ELSE IF "%ARG%"=="stop" (
    REM Stop and clean up Docker Compose services
    docker compose pause
) ELSE IF "%ARG%"=="clean-volumes" (
    REM Stop and clean up Docker Compose services
    docker compose down --volumes
) ELSE IF "%ARG%"=="clean-containers" (
    REM Stop and clean up Docker Compose services
    docker compose down --remove-orphans
) ELSE IF "%ARG%"=="clean" (
    REM Stop and clean up Docker Compose services
    docker compose down --volumes --remove-orphans
) ELSE (
    REM Display help section
    ECHO Usage: %0 {start^|stop^|clean-volumes^|clean-containers^|clean}
    ECHO start - Launch the backend and frontend using Docker Compose
    ECHO stop  - Stop and clean up Docker Compose services
    ECHO clean-volumes - Delete volume =^> reset volumes env
    ECHO clean-containers - Delete container =^> reset containers env
    ECHO clean - Delete volume and container =^> reset docker env
)

ENDLOCAL