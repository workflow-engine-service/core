import { Const } from "./const";
import { WebRoutes } from "./routes";
import { WebServer } from "./webserver";
import express, { Express } from 'express';

export namespace Swagger {
    let info = {
        title: "Wrokflow Engine Service",
        description: "Workflow Engine API Collection",
        license: {
            name: "MIT",
            url: "https://opensource.org/licenses/MIT"
        },
        contact: {
            name: 'madkne',
            email: 'twsdelavar@gmail.com',
        },
        version: Const.VERSION,
    };
    /********************** */
    async function generate() {
        let swagger = {
            // openapi: "3.0",
            swagger: "2.0",
            info,
            // servers: [
            //     {
            //         url: `http://${Const.CONFIGS.server.host}:{port}/api/{basePath}`,
            //         description: "The production API server",
            //         basePath: {
            //             default: '/v1/'
            //         },
            //         port: {
            //             enum: [
            //                 String(Const.CONFIGS.server.port),
            //                 "80"
            //             ],
            //             default: String(Const.CONFIGS.server.port),
            //         },
            //     },
            // ],
            host: `${Const.CONFIGS.server.host}:${Const.CONFIGS.server.port}`,
            basePath: '/api/v1/',
            tags: [],
            paths: {},
            schemes: [
                "http"
            ],
            consumes: [
                "application/json"
            ],
            produces: [
                "application/json"
            ],
        };
        // =>get all apis
        let apis = WebRoutes.getRoutes();
        // =>add all tags
        for (const api of apis) {
            // =>ignore duplicate tags
            if (swagger.tags.find(i => i.name === api.tag)) continue;
            // =>add new tag
            swagger.tags.push({
                name: api.tag,
            });
        }
        // =>add all paths
        for (const api of apis) {
            api.path = '/' + api.path;
            // =>find same path
            let apiPath = swagger.paths[api.path];
            if (!apiPath) {
                swagger.paths[api.path] = {};
                apiPath = swagger.paths[api.path];
            }
            // =>add by api method
            apiPath[api.method] = {
                tags: [api.tag],
                summary: api.des,
                description: api.des,
                consumes: [
                    "application/json",
                ],
                produces: [
                    "application/json"
                ],
                deprecated: api.deprecated,
                parameters: api.parameters || [],
                responses: api.responses || {},

            };

        }


        return swagger;
    }
    /********************** */
    export async function init(app: Express) {
        try {
            const swaggerUi = require('swagger-ui-express');
            const swaggerDocument = await generate();

            app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
                explorer: true,
                customCss: '.swagger-ui .topbar .topbar-wrapper .link { display: none }'
            }));
            app.get('/api-docs', swaggerUi.setup(swaggerDocument));
            console.log(`swagger docs now is in '/api-docs'`);
        } catch (e) {
            console.warn('can not init swagger!');
            console.error(e);
        }
    }
}