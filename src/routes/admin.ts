import { ApiRoute } from "src/interfaces";

export const adminApis: ApiRoute[] = [
    {
        method: 'POST',
        path: 'workflow/deploy',
        functionName: 'deployWorkflow',
        tags: ['admin', 'workflow',],
        des: 'get a json code and deploy it as workflow',
        responses: {
            '200': {
                description: 'successful operation',
            },
        },
        parameters: [
            {
                name: 'request',
                in: 'body',
                required: true,
                type: 'object',
                schema: {
                    type: "object",
                    properties: {
                        code: {
                            $ref: "#/definitions/WorkflowDescriptor"
                        },
                    },
                }
            },
        ],
        usedDefinitions: ['WorkflowDescriptor']
    },
    {
        method: 'POST',
        path: 'user/add',
        functionName: 'userAdd',
        tags: ['admin'],
        des: 'add new user to workflow',
        responses: {
            '200': {
                description: 'successful operation',
                schema: {
                    $ref: "#/definitions/UserModel"
                }
            },
        },
        parameters: [
            {
                name: 'request',
                in: 'body',
                required: true,
                type: 'object',
                schema: {
                    type: "object",
                    properties: {
                        user: {
                            $ref: "#/definitions/UserModel"
                        },
                    },
                }
            },
        ],
        usedDefinitions: ['UserModel']
    },
    {
        method: 'GET',
        path: 'user/list',
        functionName: 'usersList',
        tags: ['admin'],
        des: 'get list of users',
        parameters: [],
        responses: {
            '200': {
                description: 'successful operation',
                schema: {
                    type: 'array',
                    items: {
                        $ref: "#/definitions/UserModel"
                    }
                }
            },
        },
        usedDefinitions: ['UserModel']
    },
    {
        method: 'GET',
        path: 'workflow/schema',
        functionName: 'getWorkflowSchema',
        tags: ['admin', 'workflow'],
        des: 'get schema of a deployed workflow',
        parameters: [
            {
                in: 'query',
                name: 'workflow_name',
                required: true,
            },
            {
                in: 'query',
                name: 'workflow_version',
                required: false,
                type: 'number',
            },
        ],
        responses: {
            '200': {
                description: 'successful operation',
                schema: {
                    $ref: "#/definitions/DeployedWorkflowModel"
                }
            },
        },
        usedDefinitions: ['DeployedWorkflowModel']
    },

];