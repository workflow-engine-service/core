# Installation


## developer mode

you must install node.js 12 or later. also you need to run an instance of mongo.
for run mongo db, you can use docker:
```shell
sudo docker run -p 27017:27017 --name mongo -d mongo
```
> you can access monogo cli with `docker exec -it mongo mongosh --quiet`

then you need to install npm dependencies of project by `npm i` on project root directory.
finally you can run dev server with `npm run dev` and you can see on `http://localhost:8082`
## production mode :

first go to `cli/` directory and then run command `dat p i` and Done!
> for install `dat` command, see [Command Line Tool](./cli/cli.md)

> you can create a `configs.prod.json` file and set your custom configs



