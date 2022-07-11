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
];