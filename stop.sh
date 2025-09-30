# stops and clean docker container
docker stop $(docker ps -q --filter ancestor=webalea)
docker rm $(docker ps -a -q --filter ancestor=webalea)
docker rmi webalea
