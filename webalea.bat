@echo off
REM Script to manage Docker Compose services on Windows

SET ARG=%1

IF "%ARG%"=="start" (
    REM Launch the backend and frontend using Docker Compose
    docker-compose up --build -d

    REM Give Docker a moment to settle
    timeout /t 1 >nul

    REM Show the running services and their published localhost addresses (simplified)
    FOR /F "tokens=*" %%i IN ('docker-compose ps -q') DO (
        SET ID=%%i
        FOR /F "tokens=*" %%p IN ('docker inspect -f "%%{{range $p,$conf := .NetworkSettings.Ports}}{{if $conf}}{{printf "%%s=%%s:%%s\n" $p (index $conf 0).HostIp (index $conf 0).HostPort}}{{else}}{{printf "%%s=unmapped\n" $p}}{{end}}{{end}}" %%i') DO (
            SET LINE=%%p
            SET PROTOPORT=!LINE:*=!
            SET MAPPING=!LINE:*!=!
            IF "!MAPPING!"=="unmapped" (
                ECHO !ID!: !PROTOPORT! -> unmapped
            ) ELSE (
                FOR /F "tokens=1,2 delims=:" %%a IN ("!MAPPING!") DO (
                    SET HOSTIP=%%a
                    SET HOSTPORT=%%b
                    IF "!HOSTIP!"=="0.0.0.0" (
                        ECHO !ID!: !PROTOPORT! -> http://localhost:!HOSTPORT!
                    ) ELSE (
                        ECHO !ID!: !PROTOPORT! -> http://!HOSTIP!:!HOSTPORT!
                    )
                )
            )
        )
    )
) ELSE IF "%ARG%"=="stop" (
    REM Stop and clean up Docker Compose services
    docker-compose down --volumes --remove-orphans
) ELSE (
    REM Display help section
    ECHO Usage: %0 ^{start^|stop^}
    ECHO start - Launch the backend and frontend using Docker Compose
    ECHO stop  - Stop and clean up Docker Compose services
)
