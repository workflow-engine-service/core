import { Request, Response } from "express";
import { SwaggerDataType, SwaggerDataTypeFormat } from "./types";


export interface ServerConfigs {
    redis?: { [k: string]: ServerRedisConfig };
    mongo: {
        host: string;
        port: string;
        name: string;
        username?: string;
        password?: string;
    };
    server: {
        port: number;
        host?: string;
    };
    admin_users: ServerAdminUserConfig[];
    auth_user: {
        type: 'api_based' | 'directly';
        /**
         * seconds
         * for directly
         */
        lifetime: number;
        /**
         * for api_based
         */
        url: string;
        /**
         * for api_based
         */
        method: 'post' | 'get' | 'put';
        /**
         * for api_based
         * default: 'access_token'
         */
        param_name?: string;
    }
}

export interface ServerRedisConfig {
    host: string;
    port: number;
}

export interface ServerAdminUserConfig {
    username: string;
    userkey: string;
}

export interface ApiRoute {
    method: 'get' | 'post' | 'delete' | 'put';
    path: string;
    response: (req: Request, res: Response) => any;
    /**
     * for swagger
     */
    tag?: string;
    /**
     * for swagger
     */
    des?: string;
    /**
     * for swagger
     */
    type?: 'admin' | 'public';
    /**
     * for swagger
     */
    responses?: {
        [k: string]: SwaggerApiResponse;
    };
    /**
     * for swagger
     */
    parameters?: SwaggerApiParameter[];
    /**
     * for swagger
     */
    deprecated?: boolean;
}
export interface SwaggerApiResponse {
    description: string;
    content?: {
        [k in 'application/json' | '*/*' | 'application/x-www-form-urlencoded']: {
            schema?: {
                $ref?: string;
                type: SwaggerDataType;
                items?: object;
            };
        };
    };

}
export interface SwaggerApiParameter {
    name: string;
    summary?: string;
    description: string;
    example?: any;
    /**
     * path parameters, such as /users/{id}
     * query parameters, such as /users?role=admin
     * header parameters, such as X-MyHeader: Value
     * cookie parameters, which are passed in the Cookie header, such as Cookie: debug=0; csrftoken=BUSe35dohU3O1MZvDCU
     */
    in: 'query' | 'path' | 'header' | 'cookie' | 'body';
    required?: boolean;
    type?: SwaggerDataType;
    format?: SwaggerDataTypeFormat;
    allowEmptyValue?: boolean;
    /**
     * for array type
     */
    items?: {
        type?: SwaggerDataType;
        format?: SwaggerDataTypeFormat;
        enum?: string[];
        defalut?: any;
    };
    collectionFormat?: 'multi';
    defalut?: any;
}
export interface WorkflowField {
    name: string;
    type?: 'string' | 'number' | 'file';
    meta?: object;
    validation?: WorkflowFieldValidation[];
}
export interface WorkflowFieldValidation {
    builtin_check: 'file_type' | 'file_size' | 'email';
    builtin_params?: object;
    error?: string;
}

export interface WorkflowState {
    name: string;
    meta?: object;
    access_role?: string[];
    actions: WorkflowStateAction[];
}

export interface WorkflowStateAction {
    name: string;
    access_role?: string[];
    required_fields?: string[];
    optional_fields?: string[];
    type: 'hook_url' | 'redis' | 'local';
    message_required?: boolean;
    meta?: object;
    set_fields?: object;
    // =>hook url
    url?: string;
    method?: 'post' | 'put' | 'get' | 'delete';
    // =>redis
    channel?: string;
    response_channel?: string;
    // =>local
    next_state?: string;
}

export interface WorkflowProcessField {
    name: string;
    value: any;
    meta?: {

    };
}