import { SwaggerApiParameter, SwaggerApiResponse } from "./document/interfaces";
import { WorkerModel, WorkflowProcessModel } from "./models/models";
import { HttpStatusCode, MiddlewareName, RequestMethodType, SwaggerTagName } from "./types";


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
        uploads_path?: string;
        debug_mode?: boolean;
        wiki_base_url?: string;
        wiki_disabled?: boolean;
        swagger_disabled?: boolean;
        swagger_base_url?: string;
        /**
         * in seconds
         * @default 30
         */
        worker_timeout?: number;
        /**
         * max workers to async running
         * @default 10
         */
        max_worker_running?: number;
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
    /**
     * @default _admin_
     */
    role?: string;
}

export interface ApiRoute {
    method: RequestMethodType;
    path: string;
    // response: (req: Request, res: Response) => any;
    functionName: string;
    includeMiddlewares?: MiddlewareName[];
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
     * long description
     */
    description?: string;
    /**
     * for swagger
     */
    type?: 'admin' | 'public';
    /**
     * for swagger
     */
    consumes?: ('multipart/form-data' | 'application/json')[];
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
    events?: WorkflowStateEvent[];
}

export interface WorkflowStateEvent {
    /**
     * event name
     * - onInit: when current state be this state
     * - onLeave: when current state be left this state
     */
    name: 'onInit' | 'onLeave';
    type: 'redis' | 'hook_url';
    // =>hook url
    url?: string;
    method?: 'post' | 'put' | 'get' | 'delete';
    // =>redis
    channel?: string;
    response_channel?: string;

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
    redis_instance?: string;
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
    /**
     * @default sample_workflow
     */
    workflow_name: string;
    /**
     * @default 1
     */
    version?: number;
    /**
     * user roles that access to create process from this workflow
     * @default ['_all_']
     */
    create_access_roles?: string[];
    /**
     * default same as workflow name (for interfaces)
     * 
     * 
     */
    workflow_class_name?: string;
    /**
     * check when a process wants to start
     */
    process_init_check?: WorkflowProcessOnInit;
    /**
     * these actions are in all states (for interfaces) 
     * 
     * 
     */
    shared_actions?: string[];
    auto_delete_after_end?: boolean;
    /**
     * TODO: not implemented yet!
     */
    auto_start?: {
        event: 'user_add' | 'user_emove' | 'user_update';
        //TODO:
    };
    start_state: string;
    end_state: string;
    fields?: WorkflowField[];
    states: WorkflowState[];
}



export interface WorkflowStateActionResponse {
    /**
     * next state name
     */
    state_name: string;
    /**
     * message of responsible server (for hook_url, redis types)
     * saved as response_message in db
     */
    response_message?: string;
    /**
     * update some fields of process
     */
    fields?: object;


    _failed?: boolean;
}

export interface WorkflowStateActionSendParametersFields {
    required_fields?: string[];
    optional_fields?: string[];
    state_name: string;
    state_action_name: string;
    workflow_name: string;
    workflow_version: number;
    process_id: string;
    user_id: number;
    message?: string;

}

export interface WorkflowStateActionSendParameters extends WorkflowStateActionSendParametersFields {

    fields?: object;
    _process?: WorkflowProcessModel;
    _action?: WorkflowStateAction;
}

export interface WorkerStruct<R = {}> extends WorkerModel<R> {
    doAction: () => Promise<[boolean, R]>;
    successResult: (response: R) => Promise<object>;
    failedResult: (response: R) => Promise<object>;
}

export interface WorkflowProcessOnInit {
    type: 'local' | 'api';
    /**
     * check in local mode by workflow engine
     * - just_one_user_running_process: every user can only create one running process
     */
    local_check?: 'just_one_user_running_process';
    /**
     * api url can only response boolean or a error string like 'you can not create new process'
     */
    api_url?: string;
}