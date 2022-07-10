import { ApiRoute } from "src/interfaces";

export const adminApis: ApiRoute[] = [
    {
        method: 'POST',
        path: 'deploy-workflow',
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
                name: 'code',
                description: 'json code of your workflow that must deployed',
                in: 'body',
                required: true,
                type: 'object',
            }
        ],
    },
];