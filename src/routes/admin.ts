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

];