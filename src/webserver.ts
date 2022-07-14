import express, { Express } from 'express';
import { Const } from './const';
import { WebRoutes } from './routes';
import * as path from 'path';
import * as fs from 'fs';
import { Swagger } from './document/swagger';
import { debugLog } from './common';
import { Wiki } from './document/wiki';
import { MiddlewareName } from './types';
import { WebWorkers } from './workers';

export namespace WebServer {
    export let app: Express;
    export async function initWebServer() {
        return new Promise(async (res) => {

            app = express();
            app.use(express.json({ limit: '400kb', strict: false }));
            await loadMiddlewares();
            WebRoutes.routes(app);
            // =>start workers service
            WebWorkers.start();


            app.listen(Const.CONFIGS.server.port, async () => {
                console.log(`WorkFlow Engine Service listening on port ${Const.CONFIGS.server.port}!`);
                // =>init swagger, if allowed
                if (!Const.CONFIGS.server.swagger_disabled) {
                    await Swagger.init(app);
                }

                // =>init wiki, if allowed
                if (!Const.CONFIGS.server.wiki_disabled) {
                    await Wiki.init(app);
                }
                res(true);
            });
        });

    }

    async function loadMiddlewares() {
        for (const middle of Const.MIDDLEWARES) {
            let middleInit = await loadMiddleware(middle);
            // =>use as middleware
            app.use(async (req, res, next) => {
                // =>handle middleware
                const stat = await middleInit.handle(req, res);
                if (stat) {
                    next();
                }
            });
            debugLog('middleware', 'init middleware: ' + middle);
        }

        // const formidable = require('express-formidable');
        // app.use(formidable());
        // =>get upload info
        // const upload = multer({ dest: Const.CONFIGS.server.uploads_path + "/" }).any();
        // app.use(upload)
    }

    export async function loadMiddleware(middle: MiddlewareName) {
        let middleFile = await import(path.join(path.dirname(__filename), 'middlewares', middle + '.js'));
        let middleInit = new (middleFile['middleware']())();


        return middleInit;
    }


}