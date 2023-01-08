import { ConfigName, LogMode } from "../types";
import { WorkflowField, WorkflowProcessField, WorkflowState, WorkflowProcessOnInit, WorkflowProcessJob } from "../interfaces";

export interface DeployedWorkflowModel {
    name: string;
    version?: number;
    start_state: string;
    end_state: string[];
    settings: {
        auto_delete_after_end?: boolean;
        create_access_roles?: string[];
        read_access_roles?: string[];
        process_init_check?: WorkflowProcessOnInit;
    };
    fields: WorkflowField[];
    states: WorkflowState[];

    created_at: number;
    created_by: number;

    _id?: string;
}
/**
 * 20220727.2 edition
 */
export interface WorkflowProcessModel {
    /**
     * hash id
     */
    _id: string;
    workflow_name?: string;
    workflow_version?: number;
    current_state: string;
    field_values?: WorkflowProcessField[];
    history: WorkflowProcessHistoryModel[];
    workflow: DeployedWorkflowModel;
    jobs?: WorkflowProcessJob[];
    created_at: number;
    created_by: number;
    updated_at: number;
}

export interface WorkflowProcessChangeField {
    name: string; before_value: any; current_value: any;
}
export interface WorkflowProcessHistoryModel {
    before_state: string;
    current_state: string;
    user_id: number;
    created_at: number;
    message?: string;
    worker_id?: string;
    changed_fields?: WorkflowProcessChangeField[];
}

export interface UserModel {
    id?: number;
    name: string;
    roles: string[];
    email?: string;
    secret_key?: string;
    is_admin?: boolean;
    info?: {};
    created_at?: number;
    updated_at?: number;
}
export interface LogModel {
    namespace: string;
    name: string;
    user_id?: number;
    ip?: string;
    mode: LogMode;
    meta?: object;
    created_at?: number;
}

export interface SessionModel {
    user_id: number;
    ip: string;
    token: string;
    user_agent: string;
    refresh_token: string;
    checked_token_at: number;
    checked_refresh_token_at: number;
    expired_token_at: number;
    created_at: number;
}

export interface WorkerModel<R = {}> {
    _id?: string;
    type: 'state_action' | 'state_job' | 'process';
    /**
     * more is better
     * @default 1
     */
    priority?: number;
    init_at?: number;
    started_at?: number;
    started_by?: number;
    ended_at?: number;
    success?: boolean;
    meta?: object;
    response?: R;
}


export interface ConfigModel {
    _id?: string;
    name: ConfigName;
    value?: string | number | object;
    type?: 'string' | 'number' | 'json';
    updated_at?: number;
}