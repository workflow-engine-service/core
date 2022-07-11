import { Const } from "../const";
import { WebRoutes } from "../routes";
import { WebServer } from "../webserver";
import express, { Express } from 'express';
import { SwaggerTagName } from "../types";
import { errorLog, infoLog } from "../common";
import * as TJS from "typescript-json-schema";
import * as path from 'path';
import * as fs from 'fs';


export namespace Swagger {
    export let tags: { [k in SwaggerTagName]?: { description?: string; } } = {
        admin: {
            description: 'these apis just call by admin users',
        },
        workflow: {
            description: 'all Apis about workflow engine',
        },
        user: {
            description: 'all Apis about users (normal, admin)',
        },
    };
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
    let swaggerFileName = 'swagger.json';
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
            definitions: {},
            components: {},
            securityDefinitions: {
                // "Bearer": {
                //     "type": "apiKey",
                //     "name": "Authorization",
                //     "in": "header"
                // },
                "local_api_key": {
                    "type": "apiKey",
                    "name": Const.CONFIGS.auth_user.header_name,
                    "in": "header"
                }
            },

        }
        // =>get all apis
        let apis = WebRoutes.getRoutes();
        let definitions: string[] = [];
        // console.log(apis)
        // =>add all tags
        for (const api of apis) {
            if (!api.tags) continue;
            for (const tag of api.tags) {
                // =>ignore duplicate tags
                if (swagger.tags.find(i => i.name === tag)) continue;
                // =>try to find more info about tag
                let tagInfo = tags[tag];
                if (!tagInfo) {
                    tagInfo = {};
                }
                tagInfo['name'] = tag;
                // =>add new tag
                swagger.tags.push(tagInfo);

            }
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
            apiPath[api.method.toLowerCase()] = {
                tags: api.tags || [],
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
                security: [],
            };
            // =>add security option, if need
            if (!api.noAuth) {
                apiPath[api.method.toLowerCase()].security = [{
                    local_api_key: [],
                }];
            }
            // =>add definitions
            if (api.usedDefinitions) {
                for (const def of api.usedDefinitions) {
                    if (definitions.indexOf(def) > -1) continue;
                    definitions.push(def);
                }
            }
        }
        // =>load all seleted definitions
        try {
            let schemaDefinitions = await loadDefinitions(definitions);
            swagger.definitions = schemaDefinitions.definitions;
        } catch (e) {
            errorLog('swagger', 'failed to set definitions');
            errorLog('swagger', e);
        }

        // =>save swagger json file
        fs.writeFileSync(swaggerFileName, JSON.stringify(swagger, undefined, 2));


        return swagger;
    }
    /********************** */
    export async function init(app: Express) {
        try {
            const swaggerUi = require('swagger-ui-express');
            const swaggerDocument = await generate();

            app.use(Const.CONFIGS.server.swagger_base_url, swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
                explorer: true,
                customCss: '.swagger-ui .topbar .topbar-wrapper .link { display: none }'
            }));
            app.get(Const.CONFIGS.server.swagger_base_url, swaggerUi.setup(swaggerDocument));
            infoLog('swagger', `swagger docs now is in '${Const.CONFIGS.server.swagger_base_url}'`);
        } catch (e) {
            errorLog('swagger', 'can not init swagger!');
            errorLog('swagger', e);
        }
    }
    /********************** */
    export async function loadDefinitions(definitions: string[]) {
        // console.log(path.join(path.dirname(__filename), '..', '..', 'src'))
        const program = TJS.getProgramFromFiles(
            [
                path.resolve('src', 'document', 'interfaces.ts'),
                path.resolve('src', 'types.ts'),
                path.resolve('src', 'interfaces.ts'),
                path.resolve('src', 'models', 'models.ts'),
                path.resolve('src', 'apis', 'public', 'interfaces.ts'),
            ],
            {
                strictNullChecks: true,
            },
        );

        // optionally pass argument to schema generator
        const settings: TJS.PartialArgs = {
            required: true,
            defaultProps: true,
        };

        // We can either get the schema for one file and one type...
        // const schema = TJS.generateSchema(program, "WorkflowState", settings);
        const generator = TJS.buildGenerator(program, settings);
        let selectedSchema = generator.getSchemaForSymbols(definitions);
        // console.log('schema:', selectedSchema)
        return selectedSchema;
    }
}