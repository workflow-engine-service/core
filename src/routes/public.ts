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
                        owner_id: {
                            type: "integer",
                            description: 'just admin users allowed to set this property',
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
                    $ref: "#/definitions/WorkflowProcessTruncateInfo"
                }
            }
        },
        usedDefinitions: ['WorkflowProcessTruncateInfo'],
    },
    {
        method: 'POST',
        includeMiddlewares: ['FormDataParser'],
        path: 'workflow/action',
        functionName: 'doAction',
        tags: ['workflow'],
        des: 'call an access action of process from a workflow',
        description: `you can send form data with uploading files.`,
        consumes: ['multipart/form-data'],
        parameters: [
            {
                name: 'state_action',
                in: 'formData',
                required: true,
                type: 'string',
                default: 'approve',
            },
            {
                name: 'process_id',
                in: 'formData',
                required: true,
                type: 'string',
                default: '62cbc3933626b821f73cb9a2',
            },
            {
                name: 'message',
                in: 'formData',
                required: false,
                type: 'string',
                default: 'hello world',
            },
            {
                name: 'field.[fieldName]',
                in: 'formData',
                required: false,
                description: `you can add some need fields like files that name starts with 'field.'`
            },
        ],
        responses: {
            '200': {
                description: 'success to create new worker to do action and return a worker id to follow',
                schema: {
                    type: 'string',
                }
            }
        },
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
    {
        method: 'POST',
        path: 'workflow/short-action',
        functionName: 'doShortAction',
        tags: ['workflow'],
        des: 'call an access action of process from a workflow',
        description: `you can send fields as json without uploading files.\n\nyou can add some need fields like numbers, strings (not files) in 'fields' property of body`,
        parameters: [
            {
                name: 'request',
                in: 'body',
                required: true,
                type: 'object',
                schema: {
                    type: "object",
                    properties: {
                        state_action: {
                            type: "string",
                            default: 'approve',
                            required: true,
                        },
                        process_id: {
                            type: "string",
                            default: '62cbc3933626b821f73cb9a2',
                            required: true,
                        },
                        message: {
                            type: "string",
                            default: 'hello world',
                            required: false,
                        },
                        fields: {
                            type: "object",
                            default: '{}',
                            required: false,
                        },
                    },
                }
            },
        ],
        responses: {
            '200': {
                description: 'success to create new worker to do action and return a worker id to follow',
                schema: {
                    type: 'string',
                }
            }
        },
    },
    {
        method: 'GET',
        path: 'worker/info',
        functionName: 'workerInfo',
        tags: ['worker'],
        des: 'get worker details by id',
        parameters: [
            {
                name: 'id',
                in: 'query',
                required: true,
                type: 'string',
            },
        ],
        responses: {
            '200': {
                description: 'success to return worker details',
                schema: {
                    $ref: "#/definitions/WorkerModel"
                }
            },
            '404': {
                description: 'not found such worker with ithis id',
            },
        },
        usedDefinitions: ['WorkerModel'],

    },
    {
        method: 'GET',
        path: 'workflow/process-info',
        functionName: 'getProcessInfo',
        tags: ['workflow'],
        des: 'get process details by id',
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
                description: 'return process info',
                schema: {
                    $ref: "#/definitions/WorkflowProcessTruncateInfo"
                }
            },
            '404': {
                description: 'not found such process with this process id'
            }
        },
        usedDefinitions: ['WorkflowProcessTruncateInfo'],
    },
    {
        method: 'GET',
        path: 'workflow/list',
        functionName: 'getProcessList',
        tags: ['workflow'],
        des: 'get list of workflow instances (processes) for this user',
        parameters: [
            {
                name: 'filter_finished_processes',
                in: 'query',
                required: false,
                type: 'boolean',
                default: false,
            },
        ],
        responses: {
            '200': {
                description: 'return process list',
                schema: {
                    type: 'array',
                    items: {
                        $ref: "#/definitions/WorkflowProcessTruncateInfo"
                    }
                }
            },
        },
        usedDefinitions: ['WorkflowProcessTruncateInfo'],
    },
    {
        method: 'GET',
        path: 'workflow/fields',
        functionName: 'getWorkflowFieldsList',
        tags: ['workflow'],
        des: 'get list of workflow fields, if user access to this workflow',
        parameters: [
            {
                name: 'workflow_name',
                in: 'query',
                required: true,
                type: 'string',
            },
            {
                name: 'workflow_version',
                in: 'query',
                required: false,
                type: 'number',
            },
        ],
        responses: {
            '200': {
                description: 'return fields list of workflow',
                schema: {
                    type: 'array',
                    items: {
                        $ref: "#/definitions/WorkflowField"

                    }
                }
            },
        },
        usedDefinitions: ['WorkflowField'],
    },
    {
        method: 'GET',
        path: 'worker/list',
        functionName: 'getWorkersList',
        tags: ['worker'],
        des: 'get list of workers created by this user',
        parameters: [
            {
                name: 'filter_finished_workers',
                in: 'query',
                required: false,
                type: 'boolean',
                default: false,
            },
        ],
        responses: {
            '200': {
                description: 'return workers list',
                schema: {
                    type: 'array',
                    items: {
                        $ref: "#/definitions/WorkerModel"

                    }
                }
            },
        },
        usedDefinitions: ['WorkerModel'],
    },
    {
        method: 'GET',
        path: 'workflow/deployed-list',
        functionName: 'getWorkflowList',
        tags: ['workflow'],
        des: 'get list of deployed workflows info for this user',
        parameters: [
            {
                name: 'access',
                in: 'query',
                required: false,
                type: 'string',
                default: 'all',
                description: `you can set access filter as 'all' or 'create-access' or 'read-access'`
            },
        ],
        responses: {
            '200': {
                description: 'return workflow info list',
                schema: {
                    type: 'array',
                    items: {
                        $ref: "#/definitions/WorkflowDeployedInfo"

                    }
                }
            },
        },
        usedDefinitions: ['WorkflowDeployedInfo'],
    },
    {
        method: 'GET',
        path: 'user/info',
        functionName: 'getUserInfo',
        tags: ['user'],
        des: 'get info of this user',
        parameters: [
        ],
        responses: {
            '200': {
                description: 'return user info',
                schema: {
                    $ref: "#/definitions/UserModel"
                }
            },
        },
        usedDefinitions: ['UserModel'],
    },
    {
        method: 'POST',
        path: 'workflow/filter',
        functionName: 'getProcessList',
        tags: ['workflow'],
        des: 'get list of workflow processes by filter for this user',
        parameters: [
            {
                name: 'request',
                in: 'body',
                schema: {
                    type: 'object',
                    properties: {
                        workflows: {
                            type: 'array',
                            format: 'string',
                            description: `filter by workflow names like 'workflow_sample1'`,
                            default: []
                        },
                        processes: {
                            type: 'array',
                            format: 'string',
                            description: `filter by process ids`,
                            default: [],
                        },
                        filter_finished_processes: {
                            type: 'boolean',
                            default: false,
                        },
                        state: {
                            type: 'string',
                            default: undefined,
                            description: 'filter processes with specific state'
                        },
                        match_fields: {
                            type: 'object',
                            default: {},
                            description: 'filter processes with match specific fields'
                        },
                        with_fields: {
                            type: 'boolean',
                            default: false,
                            description: 'return also fields of processes'
                        },
                    }
                }
            }

        ],
        responses: {
            '200': {
                description: 'return process list',
                schema: {
                    type: 'array',
                    items: {
                        $ref: "#/definitions/WorkflowProcessTruncateInfo"

                    }
                }
            },
        },
    },
    {
        method: 'GET',
        path: 'workflow/process-history',
        functionName: 'getProcessHistory',
        tags: ['workflow'],
        des: 'return history of process',
        parameters: [
            {
                name: 'process_id',
                in: 'query',
                type: 'string',
                required: true,
            },
        ],
        responses: {
            '200': {
                description: 'return process history',
                schema: {
                    type: 'array',
                    items: {
                        $ref: "#/definitions/WorkflowProcessHistoryModel"
                    }
                }
            },
        },
        usedDefinitions: ['WorkflowProcessHistoryModel']
    },
    {
        method: 'GET',
        path: 'workflow/process-fields',
        functionName: 'getProcessFields',
        tags: ['workflow'],
        des: 'return field values of process for owner or user access to the process',
        parameters: [
            {
                name: 'process_id',
                in: 'query',
                type: 'string',
                required: true,
            },
        ],
        responses: {
            '200': {
                description: 'return process history',
                schema: {
                    type: 'array',
                    items: {
                        $ref: "#/definitions/WorkflowProcessField"
                    }
                }
            },
        },
        usedDefinitions: ['WorkflowProcessField']
    },
    {
        method: 'DELETE',
        path: 'workflow/delete',
        functionName: 'deleteProcess',
        tags: ['workflow'],
        des: 'delete a process from a workflow by process id',
        parameters: [
            {
                name: 'id',
                in: 'path',
                required: true,
                type: 'string',
            },
        ],
        responses: {
            '200': {
                description: 'success to delete the process from a workflow',
            }
        },
    },
];