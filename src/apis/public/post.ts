import { DeployedWorkflowModel, WorkflowProcessModel } from "../../models/models";
import { Auth } from "../../auth";
import { debugLog, errorLog, generateString, infoLog } from "../../common";
import { Const } from "../../const";
import { HttpStatusCode } from "../../types";
import { BaseApi } from "../base";
import { UserTokenResponse } from "./interfaces";
import mongoose from "mongoose";
import { WorkflowStateAction, WorkflowStateActionResponse } from "src/interfaces";
import { WebWorkers } from "../../workers";

export function classApi() {
    return PublicPostApi;
}

export class PublicPostApi extends BaseApi {
    async token() {
        // =>check if directly method
        if (Const.CONFIGS.auth_user.type === 'directly' || Const.CONFIGS.auth_user.type === 'dual') {
            let user = await Auth.authenticate(this.param('username'), this.param('secret_key'));
            if (user) {
                debugLog('token', JSON.stringify(user));
                // =>log user
                infoLog('user', `login user with name '${user.name}' `);
                // =>create new session
                let res = await Auth.addSession(user, this.request.req);
                // =>set cookie
                // request.res.cookie(session.cookieName, token, {
                //     expires: expired,
                //     path: session.cookiePath,
                //     // signed: true, 
                // });
                return this.response(res);
            }
        }
        // =>check if directly api based
        if (Const.CONFIGS.auth_user.type === 'api_based' || Const.CONFIGS.auth_user.type === 'dual') {
            //TODO:
        }
        return this.error(HttpStatusCode.HTTP_401_UNAUTHORIZED);
    }
    /********************************** */
    async createProcess() {
        try {
            // =>get params
            let name = this.param('name');
            let version = this.param('version');
            let workflow: DeployedWorkflowModel;
            // =>find workflow by name, version
            if (version) {
                workflow = await Const.DB.models.workflows.findOne({
                    name,
                    version,
                });
            }
            // =>find workflow by name, lastest version
            else {
                let workflows = await Const.DB.models.workflows.find({
                    name,
                }).sort({ version: -1 }).limit(1);
                if (workflows.length > 0) {
                    workflow = workflows[0];
                }
            }
            // =>if not found workflow
            if (!workflow) return this.error404(`not found such workflow '${name}:${version}'`);
            // =>check access create from this workflow
            if (!this.checkUserRoleHasAccess(workflow.settings.create_access_roles)) {
                return this.error403(`no access to create process from '${workflow.name}:${workflow.version}' workflow`);
            }
            // =>create new process
            let res = await Const.DB.models.processes.create({
                workflow_name: name,
                workflow_version: workflow.version,
                current_state: workflow.start_state,
                field_values: [],
                history: [],
                workflow: workflow,
                created_at: new Date().getTime(),
                created_by: this.request.user().id,
            });
            if (!res) return this.error400();

            return this.response(res);
        } catch (e) {
            errorLog('create_process', e);
            return this.error400();
        }
    }
    /********************************** */
    async doShortAction() {
        let processId = this.param('process_id');
        let stateActionName = this.param('state_action');
        let userMessage = this.param('message');
        // =>collect all fields
        let fields = this.param('fields', {}, true);
        // =>normalize fields
        let normalFields = {};
        for (const key of Object.keys(fields)) {
            let normalKey = key;
            if (!key.startsWith('field.')) {
                normalKey = 'field.' + key;
            }
            normalFields[normalKey] = fields[key];
        }
        // console.log('fields:', normalFields)
        // =>do action
        return await this.abstractDoAction(processId, stateActionName, userMessage, normalFields);

    }
    /********************************** */
    async doAction() {
        // console.log('fields:', this.request.req['fields'], this.request.req['files'])
        // =>get main params
        let processId = this.formDataParam('process_id');
        let stateActionName = this.formDataParam('state_action');
        let userMessage = this.formDataParam('message');
        // =>collect all fields
        let fields = this.allFormDataParams('both');
        // =>do action
        return await this.abstractDoAction(processId, stateActionName, userMessage, fields);

    }
    /********************************** */
    /********************************** */
    /********************************** */
    async abstractDoAction(processId: string, stateActionName: string, userMessage: string, fields: object) {
        let res = await this.getProcessCurrentState(processId);
        // =>if raise error
        if (Array.isArray(res)) {
            return res;
        } else {
            // =>find selected action with name
            let action = res.state.actions.find(i => i.name === stateActionName);
            if (!action) return this.error404('not found such action');
            // =>check for message required
            if (action.message_required && (!userMessage || String(userMessage).trim().length < 1)) {
                return this.error400('message required');
            }
            // =>check for required fields
            if (action.required_fields) {
                for (const field of action.required_fields) {
                    if (fields['field.' + field] === undefined) {
                        return this.error400(`must fill '${field}' field`);
                    }
                }
            }
            let needFields: object = {};
            // =>collect all required fields, optional fields
            for (const field of [...action.required_fields, ...action.optional_fields]) {
                // =>validate all required, optional fields
                //TODO:
                let value = fields['field.' + field];
                needFields[field] = value;
            }

            let workerId = await WebWorkers.addActionWorker({
                required_fields: action.required_fields,
                optional_fields: action.optional_fields,
                process_id: res.process._id,
                state_action_name: action.name,
                state_name: res.state.name,
                user_id: this.request.user().id,
                workflow_name: res.process.workflow_name,
                workflow_version: res.process.workflow_version,
                message: userMessage,
                fields: needFields,
                _action: action,
                _process: res.process,
            });
            // console.log('worker id:', workerId)
            return this.response(workerId);
        }
    }
}