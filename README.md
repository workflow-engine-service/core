# Workflow Engine Service

## Get started (for developer mode)

1. install node >= 12
2. run `export NODE_OPTIONS="--max-old-space-size=8192" # Increase to 8 GB` 
3. run monogo service (you can use docker-compose: `docker-compose up -d monogodb`)
> you can access monogo cli with `docker exec -it mongo mongosh --quiet`
4. install dependencies with `npm i`
6. run server with `npm run dev`. you can see on `http://localhost:8082`

## Get Started (for production mode)

- create docker image by `docker build -t workflow_engine:latest -f ./Dockerfile .`
- copy `configs.json` to `docker/data/app/configs` folder
- run docker image by docker-compose: `docker-compose up -d --remove-orphans`
> for remove dangling images, use `sudo docker rmi $(sudo docker images --filter "dangling=true" -q --no-trunc)`

## Author

developed by madkne