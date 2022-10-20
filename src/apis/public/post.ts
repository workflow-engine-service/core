import { DeployedWorkflowModel, WorkflowProcessModel } from "../../models/models";
import { Auth } from "../../auth";
import { dbLog, debugLog, errorLog, generateString, infoLog } from "../../common";
import { Const } from "../../const";
import { HttpStatusCode } from "../../types";
import { BaseApi } from "../base";
import { UserTokenResponse } from "./interfaces";
import mongoose from "mongoose";
import { WorkflowProcessField, WorkflowProcessJob, WorkflowStateAction, WorkflowStateActionResponse } from "src/interfaces";
import { WebWorkers } from "../../workers";
import { WorkflowEvents } from "../../events";
import { ProcessHelper } from "../processHelper";

export function classApi() {
    return PublicPostApi;
}

export class PublicPostApi extends BaseApi {
    async token() {
        debugLog('token', `user with '${this.param('username')}' username try to login...`);
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
            let version = this.paramNumber('version');
            let workflow = await this.getDeployedWorkflow(name, version);
            let ownerId = this.paramNumber('owner_id');

            let createdByUserId = this.request.user().id;
            if (ownerId && this.isAdmin()) {
                // =>check exist such user
                if (await Const.DB.models.users.findOne({ id: ownerId })) {
                    createdByUserId = ownerId;
                }
            }
            // =>if not found workflow
            if (!workflow) return this.error404(`not found such workflow '${name}:${version}'`);
            // =>check access create from this workflow
            if (!this.checkUserRoleHasAccess(workflow?.settings?.create_access_roles)) {
                return this.error403(`no access to create process from '${workflow.name}:${workflow.version}' workflow`);
            }

            // =>create process worker to add process
            let workerId = await WebWorkers.addProcessWorker({
                workflow_name: name,
                workflow_version: workflow.version,
                current_state: workflow.start_state,
                field_values: [],
                history: [],
                jobs: [],
                workflow: workflow,
                created_at: new Date().getTime(),
                created_by: createdByUserId,
                process_id: undefined,
                user_id: this.request.user().id,
            });

            return new Promise((resolve) => {
                // =>listen on process create event
                let processCreateEvent = WorkflowEvents.ProcessCreate$.subscribe(it => {
                    // =>if this  worker
                    if (it.worker_id !== workerId) return;
                    let newProcess = this.truncateProcessInfo(it.process);
                    resolve(this.response(newProcess));
                    processCreateEvent.unsubscribe();
                });
            });
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
    async getProcessList() {
        return await this.getProcessListByFilters({
            filter_finished_processes: this.paramBoolean('filter_finished_processes', false),
            workflows: this.param('workflows', [], true),
            processes: this.param('processes', [], true),
            with_fields: this.paramBoolean('with_fields', false),
            state: this.param('state'),
            match_fields: this.param('match_fields', {}, true),
            owner_id: this.paramNumber('owner_id', 0),
        });
    }
    /********************************** */
    /********************************** */
    /********************************** */
    async abstractDoAction(processId: string, stateActionName: string, userMessage: string, fields: object) {
        try {
            let res = await this.getProcessCurrentState(processId);
            // =>if raise error
            if (Array.isArray(res)) {
                return res;
            } else {
                // =>check access action
                if (!this.checkUserRoleHasAccess(res.state.actions.find(i => i.name === stateActionName)?.access_role, { process: res.process })) {
                    return this.error403('no access to action info');
                }
                // =>execute action
                let execAction = await ProcessHelper.executeStateAction(res.process, res.state, stateActionName, userMessage, fields, this.request.user().id);
                // =>if error
                if (execAction.error) {
                    return this.error400(execAction.error);
                }
                return this.response(execAction.workerId);
            }
        } catch (e) {
            errorLog('err546325', e, this.request.user().id);
            return this.error400('bad request');
        }
    }


}