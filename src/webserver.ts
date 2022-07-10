import express from 'express';
import { Const } from './const';
import { WebRoutes } from './routes';


export namespace WebServer {
    export async function initWebServer() {
        return new Promise((res) => {

            const app = express();
            app.use(express.json());
            WebRoutes.routes(app);

            app.listen(Const.CONFIGS.server.port, () => {
                console.log(`WorkFlow Engine Service listening on port ${Const.CONFIGS.server.port}!`),
                    res(true);
            });
        });

    }
}