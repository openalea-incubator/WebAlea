# Launch a docker conatiner with both the backend and the frontend

docker build -t webalea .
docker run -d -p 8000:8000 -p 3000:3000 webalea