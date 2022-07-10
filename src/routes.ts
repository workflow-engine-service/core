import { Express } from 'express';
import * as path from 'path';
import { ApiRoute } from './interfaces';

export namespace WebRoutes {
    const adminApis: ApiRoute[] = [
        {
            method: 'post',
            path: 'deploy-workflow',
            response: async (req, res) => {
                res.json({ msg: 'hello' })
            }
        }
    ];
    export function routes(app: Express) {
        // =>add admin apis
        for (const api of adminApis) {
            app[api.method]('/api/v1/admin/' + api.path, api.response);
        }
        // app.get('/', (req, res) => {
        //     return res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
        // });
        // app.use('/assets', expressStatic(path.join(__dirname, '..', 'public', 'assets')));

    }
}