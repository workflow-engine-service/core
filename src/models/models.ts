import { WorkflowField, WorkflowProcessField, WorkflowState } from "../interfaces";

export interface DeployedWorkflowModel {
    name: string;
    version?: number;
    start_state: string;
    end_state: string;
    settings: {
        auto_delete_after_end?: boolean;
    };
    fields: WorkflowField[];
    states: WorkflowState[];
}

export interface WorkflowProcessModel {
    /**
     * hash id
     */
    id: string;
    workflow_name?: string;
    workflow_version?: number;
    current_state: string;
    field_values?: WorkflowProcessField[];
}

export interface UserModel {
    id: number;
    name: string;
    role: string;
    email?: string;
    secret_key: string;
    is_admin?: boolean;
    info?: object;
}