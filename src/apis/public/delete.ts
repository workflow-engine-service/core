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
    return PublicDeleteApi;
}

export class PublicDeleteApi extends BaseApi {
    async deleteProcess() {
        try {
            // =>get params
            let processId = this.param('id');
            // =>find process by id
            let res = await this.getProcess(processId);
            if (Array.isArray(res)) return res;
            // =>check access to delete this process
            if (!this.checkUserRoleHasAccess(res.process.workflow?.settings?.create_access_roles, { process: res.process })) {
                return this.error403(`no access to delete process`);
            }
            await Const.DB.models.processes.findByIdAndDelete(processId);
            this.infoLog('process', 'delete_process', {
                user: this.request.user().id,
                process_id: processId,
            });
            return this.response(true);
        } catch (e) {
            errorLog('delete_process', e);
            return this.error400();
        }
    }
    /********************************** */
}