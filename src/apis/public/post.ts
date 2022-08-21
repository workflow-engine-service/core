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
                created_by: this.request.user().id,
                process_id: undefined,
            });

            return new Promise((res) => {
                // =>listen on process create event
                let processCreateEvent = WorkflowEvents.ProcessCreate$.subscribe(it => {
                    // =>if this  worker
                    if (it.worker_id !== workerId) return;
                    res(this.response(it.process));
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
    /********************************** */
    /********************************** */
    async abstractDoAction(processId: string, stateActionName: string, userMessage: string, fields: object) {
        try {
            let res = await this.getProcessCurrentState(processId);
            // =>if raise error
            if (Array.isArray(res)) {
                return res;
            } else {
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