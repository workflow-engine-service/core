import express, { Express } from 'express';
import { Const } from './const';
import { WebRoutes } from './routes';
import * as path from 'path';
import * as fs from 'fs';
import { Swagger } from './swagger';

export namespace WebServer {
    let app: Express;
    export async function initWebServer() {
        return new Promise((res) => {

            app = express();
            app.use(express.json());
            WebRoutes.routes(app);
            Swagger.init(app);

            app.listen(Const.CONFIGS.server.port, () => {
                console.log(`WorkFlow Engine Service listening on port ${Const.CONFIGS.server.port}!`),
                    res(true);
            });
        });

    }


}