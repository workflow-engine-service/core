import express, { Express } from 'express';
import { Const } from './const';
import { WebRoutes } from './routes';
import * as path from 'path';
import * as fs from 'fs';
import { Swagger } from './document/swagger';
import { debugLog } from './common';
import { Wiki } from './document/wiki';

export namespace WebServer {
    let app: Express;
    export async function initWebServer() {
        return new Promise(async (res) => {

            app = express();
            app.use(express.json({ limit: '400kb', strict: false }));
            await loadMiddlewares();
            WebRoutes.routes(app);
            // =>init swagger, if allowed
            if (!Const.CONFIGS.server.swagger_disabled) {
                await Swagger.init(app);
            }

            // =>init wiki, if allowed
            if (!Const.CONFIGS.server.wiki_disabled) {
                await Wiki.init(app);
            }

            app.listen(Const.CONFIGS.server.port, () => {
                console.log(`WorkFlow Engine Service listening on port ${Const.CONFIGS.server.port}!`),
                    res(true);
            });
        });

    }

    async function loadMiddlewares() {
        for (const middle of Const.MIDDLEWARES) {
            let middleFile = await import(path.join(path.dirname(__filename), 'middlewares', middle + '.js'));
            let middleInit = new (middleFile['middleware']())();
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
    }


}