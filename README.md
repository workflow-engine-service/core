# Workflow Engine Service - version 0.9 (beta)

WES (workflow engine service) is a workflow engine that can be expose some useful api endpoints for clients and servers and reduced coding for your application. More features of WES :

1. Easy to use and easy to learn
2. common api endpoints for clients
3. microservice architecture
4. Fast and powerful
5. written on node.js, typescript
6. fields validation
7. provide interfaces in python3
8. using mongodb and docker
9. cli support

## use cli

- clone `https://github.com/workflow-engine-service/cli` into `cli/` directory.

## use frontend

- clone `https://github.com/workflow-engine-service/angular-frontend` into `frontend/` directory.

### development mode

- go to `configs.dev.json` and set `frontend_path: "./frontend/dist"` and `frontend_url: "/frontend"` into `server` namespace
> for development: go to `frontend/` directory and command `npm i` and after develop codes build project with `ng b`



## Get started (for developer mode)

1. install node >= 12
2. run `export NODE_OPTIONS="--max-old-space-size=8192" # Increase to 8 GB` 
3. run monogo service (run: `sudo docker run -p 27017:27017 --name mongo -d mongo`)
> you can access monogo cli with `docker exec -it mongo mongosh --quiet`
4. install dependencies with `npm i`
5. copy from `configs.dev.sample.json` file and create `configs.dev.json` file
6. run server with `npm run dev`. you can see on `http://localhost:8082`

## Get Started (for production mode)

- cd to `cli/` folder
- run command `dat p i`
> for install `dat` command, see `cli/README.md` file

> you can create a `configs.prod.json` file and set your custom configs

## Author

developed by madkne

## License
WES is available under the [Creative Commons Attribution Share Alike 4.0](./LICENSE)