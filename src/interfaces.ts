import { SwaggerApiParameter, SwaggerApiResponse } from "./document/interfaces";
import { HttpStatusCode, RequestMethodType, SwaggerTagName } from "./types";


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
        logs_path?: string;
        debug_mode?: boolean;
        wiki_base_url?: string;
        wiki_disabled?: boolean;
        swagger_disabled?: boolean;
        swagger_base_url?: string;
    };
    admin_users: ServerAdminUserConfig[];
    auth_user: {
        type: 'api_based' | 'directly' | 'dual';
        /**
         * seconds
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
         * @default: 'access_token'
         */
        param_name?: string;
        /**
         * @default: "authentication"
         */
        header_name?: string,

    }
}

export interface ServerRedisConfig {
    host: string;
    port: number;
}

export interface ServerAdminUserConfig {
    username: string;
    secretkey: string;
}

export interface ApiRoute {
    method: RequestMethodType;
    path: string;
    // response: (req: Request, res: Response) => any;
    functionName: string;
    /**
     * not need to add auth header in request
     */
    noAuth?: boolean;
    /**
     * @default v1
     */
    version?: 'v1';
    /**
     * used for auth middleware, routing
     */
    absPath?: string;
    /**
     * for swagger
     */
    tags?: SwaggerTagName[];
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
    /**
     * for swagger
     * select interfaces, types of source code
     */
    usedDefinitions?: string[];
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

export interface APIResponse<T = any> {
    success: boolean;
    message?: string;
    data: T;
    responseTime?: number;
    statusCode: HttpStatusCode;
    paginate?: {
        //TODO:
    },
    error?: any;
}


export interface WorkflowDescriptor {
    workflow_name: string;
    version?: number;
    /**
     * default same as workflow name (for interfaces)
     */
    workflow_class_name?: string;
    /**
     * these actions are in all states (for interfaces) 
     */
    shared_actions?: string[];
    auto_delete_after_end?: boolean;
    auto_start?: {
        event: 'user_add' | 'user_emove' | 'user_update';
        //TODO:
    };
    start_state: string;
    end_state: string;
    fields?: WorkflowField[];
    states: WorkflowState[];
}