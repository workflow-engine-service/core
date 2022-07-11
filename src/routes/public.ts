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
                            type: "integer",
                            default: 1,
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
    },
    {
        method: 'POST',
        path: 'workflow/action',
        functionName: 'doAction',
        tags: ['workflow'],
        des: 'call an access action of process from a workflow',
        description: `you can send json object without uploading files or send form data with uploading files.\n you can send 'files' just as form data not json object`,
        parameters: [
            {
                name: 'request',
                in: 'body',
                required: true,
                type: 'object',
                schema: {
                    type: "object",
                    properties: {
                        start_state: {
                            type: "string",
                            default: 'start'
                        },
                        process_id: {
                            type: "string",
                            default: '345ewt4345'
                        },
                        message: {
                            type: "string",
                            default: 'just message',
                            required: false,
                        },
                        fields: {
                            type: "object",
                            default: {},
                            required: false,
                        },
                        files: {
                            type: "array",
                            default: [],
                            required: false,
                        },
                    },
                }
            },
        ],
        // responses: {
        //     '200': {
        //         description: 'success to create new process from a workflow and return process info (includes process id)',
        //         schema: {
        //             $ref: "#/definitions/WorkflowProcessModel"
        //         }
        //     }
        // },
    },
    {
        method: 'GET',
        path: 'workflow/state-info',
        functionName: 'getStateInfo',
        tags: ['workflow'],
        des: 'get current state of workflow process',
        parameters: [
            {
                name: 'process_id',
                in: 'query',
                required: true,
                type: 'string',
            },
        ],
        responses: {
            '200': {
                description: 'return current state info of process',
                schema: {
                    $ref: "#/definitions/WorkflowState"
                }
            },
            '404': {
                description: 'not found any process with this process id'
            }
        },
        usedDefinitions: ['WorkflowState'],
    },
];