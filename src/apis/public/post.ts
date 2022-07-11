import { DeployedWorkflowModel } from "../../models/models";
import { Auth } from "../../auth";
import { generateString, infoLog } from "../../common";
import { Const } from "../../const";
import { HttpStatusCode } from "../../types";
import { BaseApi } from "../base";
import { UserTokenResponse } from "./interfaces";
import mongoose from "mongoose";

export function classApi() {
    return PublicPostApi;
}

export class PublicPostApi extends BaseApi {
    async token() {
        // =>check if directly method
        if (Const.CONFIGS.auth_user.type === 'directly' || Const.CONFIGS.auth_user.type === 'dual') {
            let user = await Auth.authenticate(this.param('username'), this.param('secret_key'));
            if (user) {
                // =>log user
                infoLog('user', 'login user with id ' + user.name);
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

        return this.response(res);
    }
    /********************************** */
    async doAction() {
        //TODO:
    }
}