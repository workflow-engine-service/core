import express, { Express } from 'express';
import { Const } from './const';
import { WebRoutes } from './routes';
import * as path from 'path';
import * as fs from 'fs';
import { Swagger } from './document/swagger';
import { debugLog, errorLog, importFile } from './common';
import { Wiki } from './document/wiki';
import { MiddlewareName } from './types';
import { WebWorkers } from './workers';
import { WorkflowJob } from './jobs';
import * as https from 'https';
// import * as cors from 'cors';

export namespace WebServer {
    export let app: Express;
    export async function initWebServer() {
        return new Promise(async (res) => {
            app = express();
            app.use(express.json({ limit: '400kb', strict: false }));
            // =>enable cors policy
            const corsOptions = {
                origin: '*',
                credentials: true,            //access-control-allow-credentials:true
                optionSuccessStatus: 200,
            }
            var cors = require('cors');
            app.use(cors(corsOptions));
            await loadMiddlewares();
            WebRoutes.routes(app);
            // =>start workers service
            WebWorkers.start();
            // =>start workflow job service
            WorkflowJob.start();

            // =>run https server
            if (Const.CONFIGS.server.ssl) {
                try {
                    if (!Const.CONFIGS.server.ssl.port) Const.CONFIGS.server.ssl.port = 443;
                    var privateKey = fs.readFileSync(Const.CONFIGS.server.ssl.privateKeyPath);
                    var certificate = fs.readFileSync(Const.CONFIGS.server.ssl.certificatePath);

                    var credentials = { key: privateKey, cert: certificate };

                    https.createServer(credentials, app)
                        .listen(Const.CONFIGS.server.ssl.port, () => {
                            console.log(`(https) WorkFlow Engine Service listening on port ${Const.CONFIGS.server.ssl.port}!`);
                        });
                } catch (e) {
                    // Const.CONFIGS.server.ssl = undefined;
                    errorLog('ssl', `can not set ssl and init https server`);
                    errorLog('ssl', e);
                }
            }
            // =>run http server
            app.listen(Const.CONFIGS.server.port, async () => {
                console.log(`(http) WorkFlow Engine Service listening on port ${Const.CONFIGS.server.port}!`);
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

    // async function afterWebserverInit(res: (boolean) => any) {
    //     console.log(`WorkFlow Engine Service listening on port ${Const.CONFIGS.server.port}!`);
    //     // =>init swagger, if allowed
    //     if (!Const.CONFIGS.server.swagger_disabled) {
    //         await Swagger.init(app);
    //     }

    //     // =>init wiki, if allowed
    //     if (!Const.CONFIGS.server.wiki_disabled) {
    //         await Wiki.init(app);
    //     }
    //     res(true);
    // }

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
        let middleFile = await importFile(path.join(path.dirname(__filename), 'middlewares', middle));
        if (!middleFile) {
            errorLog('middleware', `can not load '${middle}' middleware`);
            return undefined;
        }
        let middleInit = new (middleFile['middleware']())();


        return middleInit;
    }


}