# Workflow Engine Service - version 0.4 (beta)

## Get started (for developer mode)

1. install node >= 12
2. run `export NODE_OPTIONS="--max-old-space-size=8192" # Increase to 8 GB` 
3. run monogo service (run: `sudo docker run -p 27017:27017 --name mongo -d mongo`)
> you can access monogo cli with `docker exec -it mongo mongosh --quiet`
4. install dependencies with `npm i`
6. run server with `npm run dev`. you can see on `http://localhost:8082`

## Get Started (for production mode)

- cd to `cli/` folder
- run command `dat p i`
> for install `dat` command, see `cli/README.md` file

> you can create a `configs.prod.json` file and set your custom configs

## Author

developed by madkne