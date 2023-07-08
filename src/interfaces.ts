import { SwaggerApiParameter, SwaggerApiResponse } from "./document/interfaces";
import { WorkerModel, WorkflowProcessModel } from "./models/models";
import { HookMethodType, HttpStatusCode, MiddlewareName, RequestMethodType, SwaggerTagName, WorkflowFieldDataType, WorkflowStateActionType, WorkflowStateEventName } from "./types";


export interface ServerConfigs {
    redis?: { [k: string]: ServerRedisConfig };
    mongo: {
        host: string;
        port: string;
        name: string;
        username?: string;
        password?: string;
        /**
         * used for docker prod
         */
        timezone?: string;
    };
    server: {
        port: number;
        host?: string;
        logs_path?: string;
        uploads_path?: string;
        debug_mode?: boolean;
        debug_level?: number;
        tmp_path?: string;
        ssl?: {
            privateKeyPath: string;
            certificatePath: string;
            /**
             * @default 443
             */
            port?: number;
        };
        /**
         * @deprecated
         */
        wiki_base_url?: string;
        /**
         * @deprecated
         */
        wiki_disabled?: boolean;
        swagger_disabled?: boolean;
        swagger_base_url?: string;
        /**
         * @default host:port
         */
        swagger_hostname?: string;
        frontend_path?: string;

        /**
         * @default /assets
         */
        frontend_assets_path?: string;
        frontend_url?: string;
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

        timing_profile_enabled?: boolean;
        /**
         * auto fill by system
         */
        __base_src_path?: string;
    };
    alias?: {
        [k: string]: {
            type: 'hook_url' | 'redis';
            [k1: string]: any;
        }
    },
    admin_users: ServerAdminUserConfig[];
    auth_user: {
        type: 'api_based' | 'directly' | 'dual';
        /**
         * seconds
         */
        lifetime?: number;
        /**
         * for api_based
         */
        url?: string;
        /**
         * for api_based
         * @default get
         */
        method?: 'post' | 'get' | 'put';
        /**
         * for api_based
         * @default: 'Authorization'
         */
        api_header_name?: string;
        /**
         * @default: "Authorization"
         */
        header_name: string,
        /**
         * @default 2000 (ms)
         */
        api_timeout?: number;
        /**
         * for api_based (in ms)
         * @default: 100
         */
        api_cache_time?: number;
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
     * @default [_admin_]
     */
    roles?: string[];
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
    type?: WorkflowFieldDataType;
    /**
     * any data useful for client
     */
    meta?: object;
    /**
     * you can set more validations on field
     */
    validation?: WorkflowFieldValidation[];
}
export interface WorkflowFieldValidation {
    type: 'max_length' | 'min_length' | 'accept_pattern' | 'reject_pattern' | 'email' | 'min' | 'max' | 'api' | 'file_type' | 'file_size';
    /**
     * for types: max_length| 'min_length' | 'min' | 'max'|'file_type' | 'file_size'
     */
    value?: number | string[];
    /**
     * for types: 'accept_pattern' | 'reject_pattern'
     */
    regex_value?: {
        pattern: string;
        flags?: string[];
    };
    /**
     * for types: 'api'
     * also supports 'alias'
     */
    api_value?: {
        url: string;
        base_url?: string;
        method?: HookMethodType;
        headers?: object;
    }
    error?: string;
}

export interface WorkflowState {
    name: string;
    meta?: object;
    /**
     * roles to view this state (default: `['_all_']`)
     */
    access_role?: string[];
    /**
     * actions of state
     */
    actions: WorkflowStateAction[];
    /**
     * you can define events on state
     */
    events?: WorkflowStateEvent[];

    jobs?: WorkflowStateJob[];
}

export interface WorkflowStateEvent {

    name: WorkflowStateEventName;
    type: 'redis' | 'hook_url';
    alias_name?: string;
    // =>hook url
    base_url?: string;
    url?: string;
    method?: HookMethodType;
    headers?: {};
    // =>redis
    channel?: string;
    redis_instance?: string;

}

export interface WorkflowStateJobTime {

    /**
     * type: static
     */
    timestamp?: number | WorkflowCalculator;
    /**
     * type: afterTime (day of month)
     */
    day?: number | WorkflowCalculator;
    // /**
    //  * type: weekly|monthly
    //  */
    // weekday?: number;
    /**
     * daily|weekly|monthly|afterTime|static
     */
    hour?: number | WorkflowCalculator;
    /**
     * type: daily|weekly|hourly|afterTime|monthly|static
     */
    minute?: number | WorkflowCalculator;
    /**
     * type: daily|weekly|hourly|afterTime|monthly|static|minutely 
     */
    second?: number | WorkflowCalculator;
}

/**
 * @example if (myfield > 5) return 'state3' else 'state4'
 * { 
 *  __if: {
 *      __eq: [{__field: "myfield"}, {__const: 5}]
 * },
 * __then: {__const: "state3"},
 * __else: {__const: "state4"}
 *  }
 * }
 * @example return myfield*2
 * {
 *  __mul: [{__field: "myfield"}, {__const: 2}]
 * }
 */
export interface WorkflowCalculator {
    __field?: string;
    // __return?: WorkflowCalculator;
    __const?: string | number | boolean;
    /**conditions */
    __if?: WorkflowCalculator;
    __then?: WorkflowCalculator;
    __else?: WorkflowCalculator;
    __or?: WorkflowCalculator[];
    __and?: WorkflowCalculator[];
    __eq?: [WorkflowCalculator, WorkflowCalculator];
    __gt?: [WorkflowCalculator, WorkflowCalculator];
    __lt?: [WorkflowCalculator, WorkflowCalculator];
    /**functions */
    __add?: WorkflowCalculator[];
    __minus?: WorkflowCalculator[];
    __mul?: WorkflowCalculator[];
}
export interface WorkflowStateJob {
    _id?: string;
    // type: WorkflowStateJobScheduleType;
    /**
     * @default 0 (unlimited repeat)
     */
    repeat?: number;
    time: WorkflowStateJobTime;
    /**
     * fields to will set after time seen
     */
    set_fields?: object;
    /**
     * state to will execute after time seen
     */
    action_name?: string;
    /**
     * next state to will go after time seen
     */
    state_name?: string;
    /**
     * set last calculated job run timestamp (in matchJobTime)
     */
    _last_job_dateTime?: number;
}

export interface WorkflowStateJobResponse {
    set_fields?: object;
    next_state?: string;
    _process?: WorkflowProcessModel;
    error?: string;
    actionWorkerId?: string;
}

export interface WorkflowProcessResponse {

    process?: WorkflowProcessModel;
}

export interface WorkflowBaseWorkerSendParameters {
    process_id: string;
    user_id: number;
    owner_id?: number;
    _process?: WorkflowProcessModel;
}

export interface WorkflowActiveJobSendParameters extends WorkflowBaseWorkerSendParameters, WorkflowActiveJob {
    _state?: WorkflowState;
}

export interface WorkflowCreateProcessSendParameters extends WorkflowBaseWorkerSendParameters, Omit<WorkflowProcessModel, '_id' | 'updated_at'> {
    _id?: string;
    updated_at?: number;
}

export interface WorkflowProcessJob extends WorkflowStateJob {
    /**
     * @private
     */
    __job_state_name: string;
}

export interface WorkflowActiveJob extends WorkflowStateJob {
    __job_state_name: string;
    process_id: string;
    started_at?: number;
    current_repeat?: number;
}

export interface WorkflowStateAction {
    name: string;
    access_role?: string[];
    required_fields?: string[];
    optional_fields?: string[];
    send_fields?: string[];
    type: WorkflowStateActionType;
    message_required?: boolean;
    meta?: object;
    set_fields?: object;
    alias_name?: string;
    // =>hook url
    base_url?: string;
    /**
     * can be absolute (without using base_url)
     * or can be relative (with using base_url)
     */
    url?: string;
    method?: HookMethodType;
    headers?: object;
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
    paginate?: APIResponsePagination,
    error?: any;
}

export interface APIResponsePagination {
    page_size: number;
    page: number;
    page_count: number;
}

/**
 * @edition 20220906.1
 */
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
     * user roles that access to read process from this workflow
     * @default ['_all_']
     */
    read_access_roles?: string[];
    /**
     * check when a process wants to start
     */
    process_init_check?: WorkflowProcessOnInit;
    /**
     * delete process after enter to end state
     */
    auto_delete_after_end?: boolean;
    /**
     * TODO: not implemented yet!
     */
    auto_start?: {
        event: 'user_add' | 'user_remove' | 'user_update';
        //TODO:
    };
    /**
     * start state of process
     */
    start_state: string;
    /**
     * end states of process
     */
    end_state: string | string[];
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
    _process?: WorkflowProcessModel;
}

export interface WorkflowStateActionSendParametersFields {
    state_name: string;
    state_action_name: string;
    workflow_name: string;
    workflow_version: number;
    process_id: string;
    user_id: number;
    owner_id: number;
    message?: string;
    required_fields?: WorkflowProcessField[];
    optional_fields?: WorkflowProcessField[];
    send_fields?: WorkflowProcessField[];


}

export interface WorkflowStateEventSendParametersFields {
    process_id: string;
    state_name: string;
    fields?: object;
    name: WorkflowStateEventName;
    user_id?: number;
    owner_id: number;
}

export interface WorkflowStateActionSendParameters extends WorkflowBaseWorkerSendParameters, WorkflowStateActionSendParametersFields {
    fields?: object;
    _action?: WorkflowStateAction;
    owner_id: number;
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

export interface WorkflowDeployedInfo {
    workflow_name: string;
    workflow_version: number;
    create_access_roles: string[];
    read_access_roles?: string[];
    deployed_at: number;
    deployed_by: number;
}

export interface WorkflowProcessTruncateInfo extends Omit<WorkflowProcessModel, 'workflow' | 'history' | 'jobs'> {

}

