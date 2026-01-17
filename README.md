# WebAlea

Visual workflow programming for OpenAlea components

# Installation Guide – Docker Environment

This document explains **how to install and run the WebAlea application locally** using Docker and Docker Compose.

⚠️ **No technical knowledge of Docker is required.** Just follow the steps in order.

---

## 1. System Requirements

The application works on the following systems:

### Windows

* **Windows 10 or Windows 11 (64-bit)**

### Linux

* Recent Linux distribution (Ubuntu 20.04+, Debian 11+, Fedora, etc.)
* **x86_64** architecture

---

## 2. Internet Connection Required

An **Internet connection is mandatory** in the following cases:

* During the **first installation** (downloading Docker and Docker images)
* When **downloading dependencies**
* When using **external services or APIs** via the application

⚠️ Without an Internet connection, the application cannot be installed properly.

---

## 3. Installing Docker

Docker is used to automatically run the application’s server environment.

---

### 3.1 Installation on Windows

#### Step 1 – Download Docker Desktop

Download Docker Desktop for Windows from the official site:

👉 [https://www.docker.com/products/docker-desktop/](https://www.docker.com/products/docker-desktop/)

Choose the **Windows** version.

---

#### Step 2 – Install Docker Desktop

* Run the downloaded file
* Keep the default options
* Allow WSL2 installation if prompted
* Restart the computer if necessary

---

#### Step 3 – Verify Docker

* Launch **Docker Desktop**
* Wait until the status shows **Docker is running**
* The Docker icon should be visible in the taskbar

Docker Compose is included automatically.

---

### 3.2 Installation on Linux

#### Step 1 – Download Docker Engine

The recommended method is installation via the official Docker repositories.

Official documentation:
👉 [https://docs.docker.com/engine/install/](https://docs.docker.com/engine/install/)

Example for Ubuntu:

```bash
sudo apt update
# Updates the list of available packages on the system

sudo apt install -y ca-certificates curl gnupg
# Installs the tools needed to download and verify Docker

sudo install -m 0755 -d /etc/apt/keyrings
# Creates the folder that will store repository security keys

curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
# Downloads and saves the official Docker key

sudo chmod a+r /etc/apt/keyrings/docker.gpg
# Allows the system to read the Docker key

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
# Adds the official Docker repository to the source list

sudo apt update
# Updates the package list including the Docker repository

sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
# Installs Docker Engine and Docker Compose
```

---

#### Step 2 – Allow the Current User

To avoid using `sudo` for every command:

```bash
sudo usermod -aG docker $USER
# Allows the current user to use Docker without sudo
```

➡️ Log out and log back in.

---

#### Step 3 – Verify Docker

```bash
docker --version
# Shows the installed Docker version

docker compose version
# Checks that Docker Compose is installed
```

If versions are displayed, Docker is correctly installed.

---

## 4. Running the Application

The provided scripts automatically adapt according to the requested action.

👉 To **start** or **stop** the application, use the same script with the argument `start` or `stop`.

---

### 4.1 Contents of the Application Folder

The provided folder contains, among others:

* `docker-compose.yml`
* `webalea.bat` (Windows)
* `webalea.sh` (Linux / WSL)

---

### 4.2 Start the Application

#### On Windows

1. Ensure **Docker Desktop is running**
2. Open a terminal (Command Prompt or PowerShell) in the application folder
3. Run:

```
webalea.bat start
```

---

#### On Linux

1. Open a terminal in the application folder
2. Make the script executable (one-time operation):

```bash
chmod +x webalea.sh
# Allows script execution
```

3. Start the application:

```bash
./webalea.sh start
# Starts the application via Docker
```

---

### 4.3 Access the Application

Once the startup is complete, open your browser and go to:

```
http://localhost:3000
```

---

## 5. Stop the Application

### Windows

In a terminal, run:

```
webalea.bat stop
```

---

### Linux

In the application folder:

```bash
./webalea.sh stop
# Properly stops the Docker containers
```

---

## 6. Running from WSL (Windows Subsystem for Linux)

This section is for **Windows users using WSL**.

---

### 6.1 WSL-Specific Requirements

* Docker Desktop installed on Windows
* **“Use the WSL 2 based engine”** option enabled in Docker Desktop
* WSL Linux distribution installed (Ubuntu recommended)

---

### 6.2 Start the Application from WSL

1. Open your WSL terminal
2. Navigate to the project folder (e.g., `/mnt/c/Users/.../WebAlea`)
3. Verify Docker accessibility:

```bash
docker ps
# Checks that Docker Desktop is accessible from WSL
```

4. Start the application:

```bash
./webalea.sh start
# Starts the application via Docker from WSL
```

---

### 6.3 Stop the Application from WSL

```bash
./webalea.sh stop
# Stops Docker services
```

---

⚠️ Important: if a runtime error occurs, it is very likely that the `webalea.sh` file is in **Windows format (CRLF)** instead of Linux format (LF).

### Fixing CRLF Issues under WSL

If you see errors like:

* `cannot execute: required file not found`
* `syntax error near unexpected token $'do
  ''`

It means the script was created or modified in Windows.

#### Step 1 – Check the File Format

```bash
file webalea.sh
# Indicates if the file uses Windows line endings (CRLF)
```

If the output contains `CRLF line terminators`, the file must be converted.

---

#### Step 2 – Convert the File to Linux Format

Recommended method:

```bash
sudo apt install dos2unix
# Installs the conversion tool (one-time)

dos2unix webalea.sh
# Converts the file to Linux format (LF)
```

Alternative method (without installation):

```bash
sed -i 's/
$//' webalea.sh
# Removes Windows CRLF characters
```

---

#### Step 3 – Check the Shebang

The first line of the file must be:

```bash
#!/usr/bin/env bash
```

This line tells Linux how to execute the script.

---

#### Step 4 – Make the Script Executable

```bash
chmod +x webalea.sh
# Allows script execution
```

After these steps, the following command should work:

```bash
./webalea.sh start
```

---

## 7. Common Issues

### Docker Not Running

**Symptom:** the application does not start.

**Solution:**

* Open Docker Desktop (Windows)
* Check that the Docker service is active (Linux)
* Restart the startup script

---

### Port Already in Use

**Symptom:** message indicating a port is occupied.

**Solution:**

* Close applications already using these ports
* Or contact technical support

---

### First Run is Slow

During the first launch, Docker downloads the required images.

👉 This may take several minutes depending on your Internet connection.

---

✅ **Once Docker is installed, daily use is limited to starting and stopping the application via the provided scripts.**
