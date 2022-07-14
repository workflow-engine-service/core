import { WorkflowStateAction, WorkflowStateActionResponse, WorkflowStateActionSendParameters } from "src/interfaces";
import { WorkflowProcessModel } from "src/models/models";

export namespace ProcessHelper {
    export async function doActionWithLocal(params: WorkflowStateActionSendParameters): Promise<WorkflowStateActionResponse> {

        let nextState = params._action.next_state || params._process.workflow.end_state;
        return {
            state_name: nextState,
            message: `process go to ${nextState} locally`,
        };
    }
    /********************************** */

    export async function doActionWithRedis(params: WorkflowStateActionSendParameters): Promise<WorkflowStateActionResponse> {
        //TODO:
        return { state_name: null };
    }

    /********************************** */

    export async function doActionWithHookUrl(params: WorkflowStateActionSendParameters): Promise<WorkflowStateActionResponse> {
        //TODO:
        return {
            state_name: null,
        };
    }
}