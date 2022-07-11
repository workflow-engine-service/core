import { ApiRoute } from "src/interfaces";

export const publicApis: ApiRoute[] = [
    {
        method: 'GET',
        path: 'urls',
        functionName: 'urls',
        noAuth: true,
    },
    {
        method: 'POST',
        path: 'token',
        functionName: 'token',
        tags: ['user'],
        des: 'get username, secret key and authenticate user',
        noAuth: true,
        parameters: [
            {
                name: 'request',
                in: 'body',
                required: true,
                type: 'object',
                schema: {
                    type: "object",
                    properties: {
                        username: {
                            type: "string",
                            default: 'bob'
                        },
                        secret_key: {
                            type: "string",
                            default: '456332Ddx'
                        },
                    },
                }
            },
        ],
        usedDefinitions: ['UserTokenResponse'],
        responses: {
            '200': {
                description: 'success authenticate user',
                schema: {
                    "$ref": "#/definitions/UserTokenResponse"

                },
                example: `{access_token: 234wesdfew, refresh_token: sfds46f45g, lifetime: 300, expired_time: 1657455541212}`
            },
            '401': {
                description: 'username or secret key is wrong or invalid',
            }
        }
    },
    {
        method: 'POST',
        path: 'workflow/create',
        functionName: 'createProcess',
        tags: ['workflow'],
        des: 'create new process from a workflow',
        parameters: [
            {
                name: 'request',
                in: 'body',
                required: true,
                type: 'object',
                schema: {
                    type: "object",
                    properties: {
                        name: {
                            type: "string",
                            default: 'sample_workflow'
                        },
                        version: {
                            type: "string",
                            default: '1',
                            required: false,
                        },
                    },
                }
            },
        ],
        responses: {
            '200': {
                description: 'success to create new process from a workflow and return process info (includes process id)',
                schema: {
                    $ref: "#/definitions/WorkflowProcessModel"
                }
            }
        },
        usedDefinitions: ['WorkflowProcessModel'],
    }
];