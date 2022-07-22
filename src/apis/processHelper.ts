import { Const } from "../const";
import { WorkflowStateAction, WorkflowStateActionResponse, WorkflowStateActionSendParameters, WorkflowStateActionSendParametersFields } from "../interfaces";
import { WorkflowProcessModel } from "../models/models";
import { Redis } from "../redis";

export namespace ProcessHelper {
    export async function doActionWithLocal(params: WorkflowStateActionSendParameters): Promise<WorkflowStateActionResponse> {

        let nextState = params._action.next_state || params._process.workflow.end_state;
        return {
            state_name: nextState,
            response_message: `[workflow] process go to ${nextState} locally`,
        };
    }
    /********************************** */

    export async function doActionWithRedis(params: WorkflowStateActionSendParameters): Promise<WorkflowStateActionResponse> {
        try {
            // =>find redis instance
            let redisInstance: Redis;
            if (params._action.redis_instance) {
                redisInstance = Const.REDIS_INSTANCES.find(i => i.getName() === params._action.redis_instance);
            } else {
                redisInstance = Const.REDIS_INSTANCES[0];
            }
            // =>publish params to channel
            await redisInstance.publish<WorkflowStateActionSendParametersFields>(params._action.channel, {
                required_fields: params.required_fields,
                optional_fields: params.optional_fields,
                process_id: params.process_id,
                state_action_name: params.state_action_name,
                state_name: params.state_name,
                user_id: params.user_id,
                workflow_name: params.workflow_name,
                workflow_version: params.workflow_version,
                message: params.message,
            });
            // =>subscribe response from channel
            let res = await redisInstance.subscribe<WorkflowStateActionResponse>(params._action.response_channel, Const.CONFIGS.server.worker_timeout);
            let actionResponse: WorkflowStateActionResponse;
            // =>if raise error
            if (res.error) {
                actionResponse = {
                    _failed: true,
                    state_name: undefined,
                    response_message: `[workflow] ${res.error}`,
                };
            }
            else {
                if (typeof res.response === 'string') {
                    actionResponse = {
                        state_name: res.response,
                    };
                }
                if (!actionResponse.state_name) {
                    actionResponse._failed = true;
                }

            }
            if (!actionResponse.response_message) {
                if (actionResponse._failed) {
                    actionResponse.response_message = `[workflow] failed process action by redis`;
                } else {
                    actionResponse.response_message = `[workflow] process go to '${actionResponse.state_name}' by redis`;

                }
            }
            return actionResponse;

        } catch (e) {
            return {
                state_name: undefined,
                _failed: true,
                response_message: `[workflow] ${e}`,
            };
        }
    }

    /********************************** */

    export async function doActionWithHookUrl(params: WorkflowStateActionSendParameters): Promise<WorkflowStateActionResponse> {
        //TODO:
        return {
            state_name: null,
        };
    }
}