import { WorkflowStateEventName } from "../types";
import { Const } from "../const";
import { WorkflowStateActionResponse, WorkflowStateActionSendParameters, WorkflowStateActionSendParametersFields, WorkflowStateEvent, WorkflowStateEventSendParametersFields } from "../interfaces";
import { WorkflowProcessChangeField } from "../models/models";
import { Redis } from "../redis";
import { errorLog, debugLog } from "../common";
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";

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
            let redisInstance = await findRedisInstance(params._action.redis_instance);
            // =>publish params to channel
            await redisInstance.publish<WorkflowStateActionSendParametersFields>(params._action.channel, await getWorkflowStateActionSendParameters(params));
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
        try {
            if (!params._action.method) params._action.method = 'get';
            let headers = {};
            if (params._action.headers) {
                headers = { ...headers, ...params._action.headers };
            }
            let configs: AxiosRequestConfig<WorkflowStateActionSendParametersFields> = {
                method: params._action.method,
                url: params._action.url,
                headers,
                data: await getWorkflowStateActionSendParameters(params),
                timeout: Const.CONFIGS.server.worker_timeout * 1000,
            };
            if (params._action.method === 'get') {
                configs.params = await getWorkflowStateActionSendParameters(params);
            }
            debugLog('hook', `do action with hook url [${configs.method}] '${configs.url}'`);
            // =>send request
            return new Promise((resolve) => {
                let actionResponse: WorkflowStateActionResponse;
                // let response: AxiosResponse<WorkflowStateActionResponse> = await 
                axios(configs).then((response: AxiosResponse<WorkflowStateActionResponse>) => {
                    if (typeof response.data === 'string') {
                        actionResponse = {
                            state_name: response.data,
                        };
                    } else {
                        actionResponse = response.data;
                    }
                    if (!actionResponse.state_name) {
                        actionResponse._failed = true;
                    }
                }, (error: AxiosError) => {
                    actionResponse = {
                        _failed: true,
                        state_name: undefined,
                        response_message: error.message,
                    };
                }).finally(() => {
                    if (!actionResponse.response_message) {
                        if (actionResponse._failed) {
                            actionResponse.response_message = `[workflow] failed process action by hook`;
                        } else {
                            actionResponse.response_message = `[workflow] process go to '${actionResponse.state_name}' by hook`;
                        }
                    }
                    resolve(actionResponse);
                });
            });

        } catch (e) {
            return {
                state_name: undefined,
                _failed: true,
                response_message: `[workflow] ${e}`,
            };
        }
    }
    /********************************** */

    export async function emitStateEvent(eventName: WorkflowStateEventName, stateName: string, params: WorkflowStateActionSendParameters): Promise<boolean> {
        // =>find state
        let state = params._process.workflow.states.find(i => i.name === stateName);
        // =>find match event
        if (!state.events) state.events = [];
        let event = state.events.find(i => i.name === eventName);
        if (!event) return false;
        // =>collect send params by event type
        let data: WorkflowStateEventSendParametersFields = {
            state_name: stateName,
            name: eventName,
            process_id: params.process_id,
            fields: (await Const.DB.models.processes.findById(params.process_id)).field_values,
            user_id: params.user_id,
        };
        switch (eventName) {
            case 'onLeave':
                break;
            case 'onInit':

                break;
        }
        debugLog('event', `emiting event '${eventName}' on '${event.type}'...`);
        switch (event.type) {
            case 'redis':
                return await emitEventWithRedis(event, data);
            case 'hook_url':
                return await emitEventWithHookUrl(event, data);
        }
        return false;

    }

    /********************************** */
    export async function collectChangedFields(params: WorkflowStateActionSendParameters, newFields: object): Promise<WorkflowProcessChangeField[]> {
        if (!newFields) newFields = {};
        let changedFields: WorkflowProcessChangeField[] = [];
        for (const key of Object.keys(newFields)) {
            // =>find before value
            let beforeValue = undefined;
            if (params._process.field_values.find(i => i.name === key)) {
                beforeValue = params._process.field_values.find(i => i.name === key).value;
            }
            // =>Add new change field
            changedFields.push({
                name: key,
                before_value: beforeValue,
                current_value: newFields[key],
            });
        }
        return changedFields;
    }


    /********************************** */
    /********************************** */
    /********************************** */
    async function findRedisInstance(redis_instance?: string) {
        // =>find redis instance
        let redisInstance: Redis;
        if (redis_instance) {
            redisInstance = Const.REDIS_INSTANCES.find(i => i.getName() === redis_instance);
        } else {
            redisInstance = Const.REDIS_INSTANCES[0];
        }
        return redisInstance;
    }
    /********************************** */
    async function getWorkflowStateActionSendParameters(params: WorkflowStateActionSendParameters): Promise<WorkflowStateActionSendParametersFields> {
        return {
            required_fields: params.required_fields,
            optional_fields: params.optional_fields,
            process_id: params.process_id,
            state_action_name: params.state_action_name,
            state_name: params.state_name,
            user_id: params.user_id,
            workflow_name: params.workflow_name,
            workflow_version: params.workflow_version,
            message: params.message,
        };
    }
    /********************************** */

    async function emitEventWithRedis(event: WorkflowStateEvent, data: WorkflowStateEventSendParametersFields): Promise<boolean> {
        try {
            // =>find redis instance
            let redisInstance = await findRedisInstance(event.redis_instance);
            // =>publish params to channel
            await redisInstance.publish(event.channel, data);

            return true;

        } catch (e) {
            errorLog('event', e);
            return false;
        }
    }
    /********************************** */

    async function emitEventWithHookUrl(event: WorkflowStateEvent, data: WorkflowStateEventSendParametersFields): Promise<boolean> {
        try {
            if (!event.method) event.method = 'get';
            let headers = {};
            let configs: AxiosRequestConfig<WorkflowStateEventSendParametersFields> = {
                method: event.method,
                url: event.url,
                headers,
                data,
            };
            if (event.method === 'get') {
                configs.params = data;
            }
            await axios(configs);
            return true;

        } catch (e) {
            errorLog('event', e);
            return false;
        }
    }
}