import { Express } from 'express';
import * as path from 'path';
import { ApiRoute } from './interfaces';

export namespace WebRoutes {
    const adminApis: ApiRoute[] = [
        {
            method: 'post',
            path: 'deploy-workflow',
            response: async (req, res) => {
                res.status(200).json({ msg: 'hello' })
            },
            tag: 'workflow',
            des: 'get a json code and deploy it as workflow',
            responses: {
                '200': {
                    description: 'successful operation',
                },
            },
            parameters: [
                {
                    name: 'code',
                    description: 'json code of your workflow that must deployed',
                    in: 'body',
                    required: true,
                    type: 'object',
                }
            ],
        }
    ];
    const publicApis: ApiRoute[] = [];
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

    export function getRoutes(): ApiRoute[] {
        let apis = [];
        for (const api of adminApis) {
            api.type = 'admin';
            api.path = 'admin/' + api.path;
            apis.push(api);
        }
        for (const api of publicApis) {
            api.type = 'public';
            apis.push(api);
        }
        return apis;
    }
}