import { WorkflowStateEventName } from "../types";
import { Const } from "../const";
import { WorkflowActiveJobSendParameters, WorkflowBaseWorkerSendParameters, WorkflowCreateProcessSendParameters, WorkflowProcessField, WorkflowState, WorkflowStateAction, WorkflowStateActionResponse, WorkflowStateActionSendParameters, WorkflowStateActionSendParametersFields, WorkflowStateEvent, WorkflowStateEventSendParametersFields } from "../interfaces";
import { WorkflowProcessChangeField, WorkflowProcessModel } from "../models/models";
import { Redis } from "../redis";
import { errorLog, debugLog, applyAliasConfig, dbLog, makeAbsoluteUrl } from "../common";
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import { WorkflowEvents } from "../events";
import { WebWorkers } from "../workers";
import * as https from 'https';

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
            // =>check for alias_name
            params._action = applyAliasConfig<WorkflowStateAction>(params._action);
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
            // =>check for alias_name
            params._action = applyAliasConfig<WorkflowStateAction>(params._action);
            if (!params._action.method) params._action.method = 'post';
            let headers = {};
            if (params._action.headers) {
                headers = { ...headers, ...params._action.headers };
            }
            let configs: AxiosRequestConfig<WorkflowStateActionSendParametersFields> = {
                method: params._action.method,
                url: makeAbsoluteUrl(params._action.url, params._action.base_url),
                headers,
                data: await getWorkflowStateActionSendParameters(params),
                timeout: Const.CONFIGS.server.worker_timeout * 1000,
                httpsAgent: new https.Agent({ rejectUnauthorized: false }),
            };
            if (params._action.method === 'get') {
                configs.params = await getWorkflowStateActionSendParameters(params);
            }
            dbLog({ namespace: 'action', name: 'pre_doActionWithHookUrl', meta: { configs } });
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
                    dbLog({ namespace: 'action', name: 'error_on_hook_response', 'meta': { error: error.toJSON(), code: error.code } });
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

    export async function emitStateEvent(eventName: WorkflowStateEventName, stateName: string, params: WorkflowBaseWorkerSendParameters): Promise<boolean> {
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
            owner_id: params.owner_id,
        };
        switch (eventName) {
            case 'onLeave':
                break;
            case 'onInit':
                break;
        }
        dbLog({ namespace: 'event', name: 'pre_emitStateEvent', meta: { eventName, event } });

        debugLog('event', `emitting event '${eventName}' on '${event.type}'...`);
        switch (event.type) {
            case 'redis':
                return await emitEventWithRedis(event, data);
            case 'hook_url':
                return await emitEventWithHookUrl(event, data);
        }
        return false;

    }

    /********************************** */
    export async function collectChangedFields(process: WorkflowProcessModel, newFields: object): Promise<WorkflowProcessChangeField[]> {
        if (!newFields) newFields = {};
        let changedFields: WorkflowProcessChangeField[] = [];
        for (const key of Object.keys(newFields)) {
            // =>find before value
            let beforeValue = undefined;
            if (process.field_values.find(i => i.name === key)) {
                beforeValue = process.field_values.find(i => i.name === key).value;
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
            send_fields: params.send_fields,
            process_id: params.process_id,
            state_action_name: params.state_action_name,
            state_name: params.state_name,
            user_id: params.user_id,
            workflow_name: params.workflow_name,
            workflow_version: params.workflow_version,
            message: params.message,
            owner_id: params.owner_id,
        };
    }
    /********************************** */

    async function emitEventWithRedis(event: WorkflowStateEvent, data: WorkflowStateEventSendParametersFields): Promise<boolean> {
        try {
            // =>check for alias_name
            event = applyAliasConfig<WorkflowStateEvent>(event);
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
            // =>check for alias_name
            event = applyAliasConfig<WorkflowStateEvent>(event);
            if (!event.method) event.method = 'get';
            let headers = { ...event.headers };
            let configs: AxiosRequestConfig<WorkflowStateEventSendParametersFields> = {
                method: event.method,
                url: makeAbsoluteUrl(event.url, event.base_url),
                headers,
                data,
                httpsAgent: new https.Agent({ rejectUnauthorized: false }),
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
    /********************************** */

    export async function updateProcess(process: WorkflowProcessModel, newProcess: {
        newState?: string;
        userId?: number;
        message?: string;
        workerId: string;
        setFields?: object;
        params: WorkflowBaseWorkerSendParameters;
    }) {
        // =>validate new state
        if (!newProcess.newState) newProcess.newState = process.current_state;
        else {
            if (!process.workflow.states.find(i => i.name === newProcess.newState)) {
                return false;
            }
        }
        // =>check diff states
        let isStatesDiff = process.current_state !== newProcess.newState;
        if (!newProcess.setFields) newProcess.setFields = {};
        // =>call 'onLeave' event of state, if different states
        if (process.current_state && process.current_state !== newProcess.newState) {
            ProcessHelper.emitStateEvent('onLeave', process.current_state, newProcess.params);
            // =>emit 'ProcessStateOnLeave$' event
            WorkflowEvents.ProcessStateOnLeave$.next(newProcess.params._process);
        }
        // =>add process history
        process.history.push({
            before_state: process.current_state,
            current_state: newProcess.newState,
            created_at: new Date().getTime(),
            user_id: newProcess.userId,
            message: newProcess.message,
            worker_id: newProcess.workerId,
            changed_fields: (await ProcessHelper.collectChangedFields(process, newProcess.setFields)),
        });

        // =>update field values
        for (const key of Object.keys(newProcess.setFields)) {
            let index = process.field_values.findIndex(i => i.name === key);
            if (index < 0) {
                process.field_values.push({
                    name: key,
                    value: undefined,
                });
                index = process.field_values.length - 1;
            }
            process.field_values[index].value = newProcess.setFields[key];
        }
        // =>update current state
        process.current_state = newProcess.newState;
        process.updated_at = new Date().getTime();
        // =>update process
        await Const.DB.models.processes.findByIdAndUpdate(process._id, { $set: process }, { multi: true, upsert: true }).clone();
        // =>call 'onInit' event of state, if different states
        if (isStatesDiff) {
            ProcessHelper.emitStateEvent('onInit', newProcess.newState, newProcess.params);
            // =>emit 'ProcessStateOnInit$' event
            WorkflowEvents.ProcessStateOnInit$.next(newProcess.params._process);
        }
        // =>check for end state
        //TODO:

        return true;
    }


    export async function executeStateAction(process: WorkflowProcessModel, state: WorkflowState, stateActionName: string, userMessage: string, fields: object, userId?: number): Promise<{ error?: string; workerId?: string; }> {
        try {
            let requiredFieldValues: WorkflowProcessField[] = [];
            let optionalFieldValues: WorkflowProcessField[] = [];

            // =>find selected action with name
            let action = state.actions.find(i => i.name === stateActionName);
            if (!action) return { error: 'not found such action' };
            // =>normalize action
            if (!action.required_fields) {
                action.required_fields = [];
            }
            if (!action.optional_fields) {
                action.optional_fields = [];
            }
            // =>check before worker added and not end for this action
            let existWorker = await Const.DB.models.workers.find({
                ended_at: { $exists: false },
                type: 'state_action',
                meta: { $exists: true },
                "meta.process": String(process._id),
                "meta.state": state.name,
                "meta.action": action.name,

            });
            if (existWorker && existWorker.length > 0) {
                dbLog({
                    namespace: 'worker', name: 'exist_worker_on_action', meta: {
                        worker: existWorker,
                        action: action.name,
                        state: state.name,
                        process: String(process._id),
                    }
                });
                return { error: `a worker running on '${action.name}' action` };
            }
            // =>check for message required
            if (action.message_required && (!userMessage || String(userMessage).trim().length < 1)) {
                return { error: 'message required' };
            }
            // =>check for required fields
            if (action.required_fields) {
                for (const field of action.required_fields) {
                    if (fields['field.' + field] === undefined) {
                        return { error: `must fill '${field}' field` };
                    }
                }
            }
            let needFields: object = {};
            // =>collect required fields
            for (const field of action.required_fields) {
                let value = fields['field.' + field];
                // =>validate field
                let respValidate = await validateFieldValue(process, field, value);
                if (!respValidate.success) {
                    return { error: respValidate.error };
                }

                requiredFieldValues.push({
                    name: field,
                    value,
                });
                needFields[field] = value;
            }
            // =>collect optional fields
            for (const field of action.optional_fields) {
                let value = fields['field.' + field];
                // =>validate field
                let respValidate = await validateFieldValue(process, field, value);
                if (!respValidate.success) {
                    return { error: respValidate.error };
                }

                optionalFieldValues.push({
                    name: field,
                    value,
                });
                needFields[field] = value;
            }

            // =>collect send fields
            let sendProcessFields: WorkflowProcessField[] = [];
            if (action.send_fields) {
                for (const fieldName of action.send_fields) {
                    // =>find process field
                    let field = process.field_values.find(i => i.name === fieldName);
                    if (!field) continue;
                    sendProcessFields.push(field);
                }
            }

            let workerId = await WebWorkers.addActionWorker({
                required_fields: requiredFieldValues,
                optional_fields: optionalFieldValues,
                process_id: process._id,
                state_action_name: action.name,
                send_fields: sendProcessFields,
                state_name: state.name,
                user_id: userId,
                workflow_name: process.workflow_name,
                workflow_version: process.workflow_version,
                message: userMessage,
                fields: needFields,
                _action: action,
                _process: process,
                owner_id: process.created_by,
            });
            // console.log('worker id:', workerId)
            return { workerId };

        } catch (e) {
            errorLog('err546325', e, userId);
            return { error: 'bad request' };
        }
    }


    async function validateFieldValue(process: WorkflowProcessModel, fieldName: string, fieldValue: any): Promise<{ success: boolean; error?: string; }> {
        // =>find field by name
        let field = process.workflow.fields.find(i => i.name === fieldName);
        // =>check if field exist
        if (!field) return { success: false, error: `not exist '${fieldName}' field` };
        // =>check field value type
        let badType = false;
        if (field.type === 'string' && typeof fieldValue !== 'string') {
            badType = true;
        }
        else if (field.type === 'number' && typeof fieldValue !== 'number') {
            badType = true;
        }
        else if (field.type === 'boolean' && typeof fieldValue !== 'boolean') {
            badType = true;
        }
        if (badType) {
            return { success: false, error: `'${fieldValue}' value not match with data type '${field.type}' for '${fieldName}' field` };
        }
        //TODO:


        return { success: true };
    }

    export async function findProcessById(id: string) {
        let process = await Const.DB.models.processes.findById(id).populate('workflow');
        return process;
    }
}