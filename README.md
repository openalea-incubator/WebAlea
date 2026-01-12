# WebAlea
Visual workflow programming for OpenAlea components

# Guide d’installation – Environnement Docker

Ce document explique **comment installer et lancer l’application WebAlea en local** à l’aide de Docker et Docker Compose.

⚠️ **Aucune connaissance technique de Docker n’est requise.** Suivez simplement les étapes dans l’ordre.

---

## 1. Prérequis système

L’application fonctionne sur les systèmes suivants :

### Windows

* **Windows 10 ou Windows 11 (64 bits)**

### Linux

* Distribution Linux récente (Ubuntu 20.04+, Debian 11+, Fedora, etc.)
* Architecture **x86_64**

---

## 2. Connexion Internet requise

Une **connexion Internet est obligatoire** dans les cas suivants :

* Lors de la **première installation** (téléchargement de Docker et des images Docker)
* Lors du **téléchargement de dépendances**
* Lors de l’utilisation de **services ou API externes** par l’application

⚠️ Sans connexion Internet, l’application ne pourra pas être installée correctement.

---

## 3. Installation de Docker

Docker est utilisé pour lancer automatiquement l’environnement serveur de l’application.

---

### 3.1 Installation sur Windows

#### Étape 1 – Télécharger Docker Desktop

Téléchargez Docker Desktop pour Windows depuis le site officiel :

👉 [https://www.docker.com/products/docker-desktop/](https://www.docker.com/products/docker-desktop/)

Choisissez la version **Windows**.

---

#### Étape 2 – Installer Docker Desktop

* Lancez le fichier téléchargé
* Conservez les options par défaut
* Autorisez l’installation de WSL2 si cela est demandé
* Redémarrez l’ordinateur si nécessaire

---

#### Étape 3 – Vérifier Docker

* Lancez **Docker Desktop**
* Attendez que l’état indique **Docker is running**
* L’icône Docker doit être visible dans la barre des tâches

Docker Compose est inclus automatiquement.

---

### 3.2 Installation sur Linux

#### Étape 1 – Télécharger Docker Engine

La méthode recommandée est l’installation via les dépôts officiels Docker.

Documentation officielle :
👉 [https://docs.docker.com/engine/install/](https://docs.docker.com/engine/install/)

Exemple pour Ubuntu :

```bash
sudo apt update
# Met à jour la liste des paquets disponibles sur le système

sudo apt install -y ca-certificates curl gnupg
# Installe les outils nécessaires pour télécharger et vérifier Docker

sudo install -m 0755 -d /etc/apt/keyrings
# Crée le dossier qui stockera les clés de sécurité des dépôts

curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
# Télécharge et enregistre la clé officielle Docker

sudo chmod a+r /etc/apt/keyrings/docker.gpg
# Autorise le système à lire la clé Docker

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
# Ajoute le dépôt officiel Docker à la liste des sources

sudo apt update
# Met à jour la liste des paquets avec le dépôt Docker

sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
# Installe Docker Engine et Docker Compose
```

---

#### Étape 2 – Autoriser l’utilisateur courant

Pour éviter d’utiliser `sudo` à chaque commande :

```bash
sudo usermod -aG docker $USER
# Autorise l’utilisateur courant à utiliser Docker sans sudo
```

➡️ Déconnectez-vous puis reconnectez-vous.

---

#### Étape 3 – Vérifier Docker

```bash
docker --version
# Affiche la version installée de Docker

docker compose version
# Vérifie que Docker Compose est bien installé
```

Si des versions s’affichent, Docker est correctement installé.

---

## 4. Lancement de l’application

Les scripts fournis s’adaptent automatiquement selon l’action demandée.

👉 Pour **démarrer** ou **arrêter** l’application, utilisez le même script avec un argument `start` ou `stop`.

---

### 4.1 Contenu du dossier de l’application

Le dossier fourni contient notamment :

* `docker-compose.yml`
* `webalea.bat` (Windows)
* `webalea.sh` (Linux / WSL)

---

### 4.2 Démarrer l’application

#### Sur Windows

1. Vérifiez que **Docker Desktop est lancé**
2. Ouvrez un terminal (Invite de commandes ou PowerShell) dans le dossier de l’application
3. Exécutez :

```
webalea.bat start
```

---

#### Sur Linux

1. Ouvrez un terminal dans le dossier de l’application
2. Rendre le script exécutable (une seule fois) :

```bash
chmod +x webalea.sh
# Autorise l’exécution du script
```

3. Démarrer l’application :

```bash
./webalea.sh start
# Démarre l’application via Docker
```

---

### 4.3 Accéder à l’application

Une fois le démarrage terminé, ouvrez votre navigateur et accédez à :

```
http://localhost:3000
```

---

## 5. Arrêter l’application

### Windows

Dans un terminal, exécutez :

```
webalea.bat stop
```

---

### Linux

Dans le dossier de l’application :

```bash
./webalea.sh stop
# Arrête proprement les conteneurs Docker
```

---

## 6. Lancement depuis WSL (Windows Subsystem for Linux)

Cette section concerne les utilisateurs **Windows utilisant WSL**.

---

### 6.1 Prérequis spécifiques WSL

* Docker Desktop installé sur Windows
* Option **“Use the WSL 2 based engine”** activée dans Docker Desktop
* Distribution Linux WSL installée (Ubuntu recommandé)

---

### 6.2 Démarrer l’application depuis WSL

1. Ouvrez votre terminal WSL
2. Placez-vous dans le dossier du projet (ex : `/mnt/c/Users/.../WebAlea`)
3. Vérifiez que Docker est accessible :

```bash
docker ps
# Vérifie que Docker Desktop est accessible depuis WSL
```

4. Démarrez l’application :

```bash
./webalea.sh start
# Démarre l’application via Docker depuis WSL
```

---

### 6.3 Arrêter l’application depuis WSL

```bash
./webalea.sh stop
# Arrête les services Docker
```

---

⚠️ Important : si une erreur d’exécution apparaît, il est très probable que le fichier `webalea.sh` soit en **format Windows (CRLF)** au lieu du format Linux (LF).

### Correction du problème CRLF sous WSL

Si vous voyez des erreurs du type :

* `cannot execute: required file not found`
* `syntax error near unexpected token $'do
  ''`

Cela signifie que le script a été créé ou modifié sous Windows.

#### Étape 1 – Vérifier le format du fichier

```bash
file webalea.sh
# Indique si le fichier utilise des fins de ligne Windows (CRLF)
```

Si la sortie contient `CRLF line terminators`, le fichier doit être converti.

---

#### Étape 2 – Convertir le fichier en format Linux

Méthode recommandée :

```bash
sudo apt install dos2unix
# Installe l’outil de conversion (une seule fois)

dos2unix webalea.sh
# Convertit le fichier en format Linux (LF)
```

Méthode alternative (sans installation) :

```bash
sed -i 's/
$//' webalea.sh
# Supprime les caractères Windows CRLF
```

---

#### Étape 3 – Vérifier le shebang

La première ligne du fichier doit être :

```bash
#!/usr/bin/env bash
```

Cette ligne indique à Linux comment exécuter le script.

---

#### Étape 4 – Rendre le script exécutable

```bash
chmod +x webalea.sh
# Autorise l’exécution du script
```

Après ces étapes, la commande suivante doit fonctionner :

```bash
./webalea.sh start
```

---

## 7. Problèmes courants

### Docker n’est pas lancé

**Symptôme :** l’application ne démarre pas.

**Solution :**

* Ouvrir Docker Desktop (Windows)
* Vérifier que le service Docker est actif (Linux)
* Relancer le script de démarrage

---

### Port déjà utilisé

**Symptôme :** message indiquant qu’un port est occupé.

**Solution :**

* Fermer les applications utilisant déjà ces ports
* Ou contacter le support technique

---

### Première exécution lente

Lors du premier lancement, Docker télécharge les images nécessaires.

👉 Cela peut prendre plusieurs minutes selon la connexion Internet.

---

✅ **Une fois Docker installé, l’utilisation quotidienne se limite au lancement et à l’arrêt de l’application via les scripts fournis.**
