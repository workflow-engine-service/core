import { LogMode } from "../types";
import { WorkflowField, WorkflowProcessField, WorkflowState, WorkflowProcessOnInit } from "../interfaces";

export interface DeployedWorkflowModel {
    name: string;
    version?: number;
    start_state: string;
    end_state: string;
    settings: {
        auto_delete_after_end?: boolean;
        create_access_roles?: string[];
        process_init_check?: WorkflowProcessOnInit;
    };
    fields: WorkflowField[];
    states: WorkflowState[];

    _id: string;
}

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
    created_at: number;
    created_by: number;
    updated_at: number;
}

export interface WorkflowProcessHistoryModel {
    before_state: string;
    current_state: string;
    user_id: number;
    created_at: number;
    message?: string;
    changed_fields?: { name: string; before_value: any; current_value: any; }[];
}

export interface UserModel {
    id: number;
    name: string;
    roles: string[];
    email?: string;
    secret_key: string;
    is_admin?: boolean;
    info?: object;
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
    /**
     * more is better
     * @default 1
     */
    type: 'state_action';
    priority?: number;
    init_at?: number;
    started_at?: number;
    ended_at?: number;
    success?: boolean;
    response?: R;
}
