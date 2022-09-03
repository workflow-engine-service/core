import { DeployedWorkflowModel, WorkerModel, WorkflowProcessModel } from "../../models/models";
import { Auth } from "../../auth";
import { absUrl, errorLog, infoLog } from "../../common";
import { Const } from "../../const";
import { HttpStatusCode } from "../../types";
import { BaseApi } from "../base";
import { UserTokenResponse } from "./interfaces";
import { WorkflowDeployedInfo } from "src/interfaces";

export function classApi() {
    return PublicGetApi;
}

export class PublicGetApi extends BaseApi {
    async urls() {
        let urls = {};
        if (!Const.CONFIGS.server.wiki_disabled) {
            urls['wiki'] = absUrl(Const.CONFIGS.server.wiki_base_url);
        }
        if (!Const.CONFIGS.server.swagger_disabled) {
            urls['swagger'] = absUrl(Const.CONFIGS.server.swagger_base_url);
        }
        if (Const.CONFIGS.server.frontend_path) {
            urls['frontend'] = absUrl(Const.CONFIGS.server.frontend_url);
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
            if (!this.checkUserRoleHasAccess(res.process.workflow.settings.read_access_roles, { process: res.process })) {
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
            errorLog('err524223', e);
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
            if (!this.checkUserRoleHasAccess(res.process.workflow?.settings?.read_access_roles, { process: res.process })) {
                return this.error403('no access to process info');
            }


            return this.response(this.truncateProcessInfo(res.process));
        } catch (e) {
            errorLog('err3256223', e);
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
                if (!this.checkUserRoleHasAccess(res.process.workflow.settings.read_access_roles, { process: res.process })) {
                    continue;
                }
                // =>if filter end processes
                if (filter_finished_processes && res.process.current_state === res.process.workflow.end_state) {
                    continue;
                }
                // =>truncate data
                processes.push(this.truncateProcessInfo(res.process));

            }

            return this.paginateResponse(processes);
        } catch (e) {
            errorLog('err32423', e);
            return this.error400();
        }
    }

    /******************************* */
    async getWorkflowFieldsList() {
        // =>get params
        let workflowName = this.param('workflow_name');
        let workflowVersion = this.paramNumber('workflow_version');
        // =>if workflow name not exist
        if (!workflowName) return this.error400();
        try {
            let workflow = await this.getDeployedWorkflow(workflowName, workflowVersion);

            // =>if not found workflow or check access read from this workflow
            if (!workflow || !this.checkUserRoleHasAccess(workflow.settings.read_access_roles)) {
                return this.error404(`not found such workflow '${workflowName}:${workflowVersion}'`);
            }
            // =>get workflow fields
            let fields = workflow.fields;
            if (!fields) fields = [];
            // for (const field of fields) {
            // }

            return this.response(fields);

        } catch (e) {
            errorLog('err3242433', e);
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
            errorLog('err22332', e);
            return this.error400();
        }
    }

    /******************************* */
    async getWorkersList() {
        // =>get params
        let filter_finished_workers = this.paramBoolean('filter_finished_workers', false);

        try {
            let workers: WorkerModel[] = [];
            if (filter_finished_workers) {
                workers = await Const.DB.models.workers.find({ ended_at: { $exist: false } });
            } else {
                workers = await Const.DB.models.workers.find({});
            }
            if (!workers) return this.response([]);
            // =>iterate all workers
            for (const worker of workers) {
                // =>check access of worker
                if (!this.isAdmin() && worker.started_by !== this.request.user().id) {
                    continue;
                }

            }

            return this.paginateResponse(workers);
        } catch (e) {
            errorLog('err324223', e);
            return this.error400();
        }
    }
    /******************************* */
    async getWorkflowList() {
        try {
            // =>get params
            let access = this.param<'all' | 'create-access' | 'read-access'>('access', 'all');
            // =>get all workflows
            let workflows = await Const.DB.models.workflows.find();
            let list: WorkflowDeployedInfo[] = [];
            // =>iterate
            for (const flow of workflows) {
                // =>check for create access
                if (access === 'create-access' && !this.checkUserRoleHasAccess(flow.settings.create_access_roles)) {
                    continue;
                }
                // =>check for read access
                if (access === 'read-access' && !this.checkUserRoleHasAccess(flow.settings.read_access_roles)) {
                    continue;
                }
                // => check for any read or write(all)
                if (access === 'all' && !this.checkUserRoleHasAccess(flow.settings.read_access_roles) && !this.checkUserRoleHasAccess(flow.settings.create_access_roles)) {
                    continue;
                }

                list.push({
                    workflow_name: flow.name,
                    workflow_version: flow.version,
                    create_access_roles: flow.settings.create_access_roles,
                    read_access_roles: flow.settings.read_access_roles,
                    deployed_at: flow.created_at,
                    deployed_by: flow.created_by,
                });
            }

            return this.paginateResponse(list);
        } catch (e) {
            errorLog('err456232', e);
            return this.error400();
        }
    }
    /******************************* */
    async getUserInfo() {
        return this.response(this.request.user());
    }
    /******************************* */
    /******************************* */
    /******************************* */
    truncateProcessInfo(process: WorkflowProcessModel) {
        // =>check if admin
        if (this.isAdmin()) return process;
        process.workflow = undefined;
        process.field_values = undefined;
        process.history = undefined;
        return process;
    }
}