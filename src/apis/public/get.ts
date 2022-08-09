import { WorkflowProcessModel } from "../../models/models";
import { Auth } from "../../auth";
import { infoLog } from "../../common";
import { Const } from "../../const";
import { HttpStatusCode } from "../../types";
import { BaseApi } from "../base";
import { UserTokenResponse } from "./interfaces";

export function classApi() {
    return PublicGetApi;
}

export class PublicGetApi extends BaseApi {
    async urls() {
        let urls = {};
        if (!Const.CONFIGS.server.wiki_disabled) {
            urls['wiki'] = Const.CONFIGS.server.wiki_base_url;
        }
        if (!Const.CONFIGS.server.swagger_disabled) {
            urls['swagger'] = Const.CONFIGS.server.swagger_base_url;
        }
        return this.response(urls);
    }
    /******************************* */
    async getStateInfo() {
        try {
            let processId = this.param
                ('process_id');

            let res = await this.getProcessCurrentState(processId);
            // =>if raise error
            if (Array.isArray(res)) {
                return res;
            }
            // =>check read process access
            if (!this.checkUserRoleHasAccess(res.process.workflow.settings.read_access_roles)) {
                return this.error403('no access to process info');
            }
            // =>truncate data
            res.state.events = undefined;
            if (res.state.actions) {
                for (const act of res.state.actions) {
                    act.url = undefined;
                    act.headers = undefined;
                }
            }
            return this.response(res.state);
        } catch (e) {
            return this.error400();
        }
    }
    /******************************* */
    async getProcessInfo() {
        try {
            let processId = this.param
                ('process_id');
            let res = await this.getProcessCurrentState(processId);
            // =>if raise error
            if (Array.isArray(res)) {
                return res;
            }
            // =>check read process access
            if (!this.checkUserRoleHasAccess(res.process.workflow.settings.read_access_roles)) {
                return this.error403('no access to process info');
            }


            return this.response(this.truncateProcessInfo(res.process));
        } catch (e) {
            return this.error400();
        }
    }
    /******************************* */
    async getProcessList() {
        // =>get params
        let filter_finished_processes = this.paramBoolean('filter_finished_processes', false);

        try {

            // =>iterate all processes
            let processIds = await Const.DB.models.processes.find({}, { _id: true });
            if (!processIds) return this.response([]);
            let processes: WorkflowProcessModel[] = [];
            for (const pid of processIds) {
                let processId = pid._id;
                let res = await this.getProcessCurrentState(processId);
                // =>if raise error
                if (Array.isArray(res)) {
                    continue;
                }
                // =>check read process access
                if (!this.checkUserRoleHasAccess(res.process.workflow.settings.read_access_roles)) {
                    continue;
                }
                // =>truncate data
                processes.push(this.truncateProcessInfo(res.process));

            }

            return this.response(processes);
        } catch (e) {
            return this.error400();
        }
    }
    /******************************* */
    async workerInfo() {
        try {
            // =>get worker id
            let workerId = this.param('id');
            // =>find worker by id
            let worker = await Const.DB.models.workers.findById(workerId);
            if (!worker) return this.error404();

            return this.response(worker.toJSON());
        } catch (e) {
            return this.error400();
        }
    }

    /******************************* */
    /******************************* */
    /******************************* */
    truncateProcessInfo(process: WorkflowProcessModel) {
        process.workflow = undefined;
        process.field_values = undefined;
        process.history = undefined;
        return process;
    }
}