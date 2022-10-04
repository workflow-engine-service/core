import { Const } from "../const";
import { APIResponse, APIResponsePagination, WorkflowProcessField, WorkflowState } from "../interfaces";
import { HttpStatusCode, LogMode, RequestMethodType, WorkflowNamespace } from "../types";
import { CoreRequest } from "./request";
import { DeployedWorkflowModel, WorkflowProcessModel } from "../models/models";
import { clone, errorLog } from "../common";
import { ProcessHelper } from "./processHelper";
import { FilterQuery } from "mongoose";
export class BaseApi {
    request: CoreRequest;
    /*************************************** */
    constructor(request: CoreRequest) {
        this.request = request;
    }
    /*************************************** */
    param<T = string>(key: string, def?: T, isArray = false) {
        let value: T;
        if (this.request.method === 'GET' || this.request.method === 'DELETE') {
            value = this.request.req.query[key] as any;
            if (isArray) {
                try {
                    value = JSON.parse(value as any);
                } catch (e) { }
            }
        } else {
            value = this.request.req.body[key];
        }
        if ((value === undefined || value === null) && def) {
            value = def;
        }
        return value;
    }
    /*************************************** */
    paramNumber<T extends number = number>(key: string, def?: T): T {
        let value = Number(this.param<T>(key, def));
        if (isNaN(value)) return def;
        return value as T;
    }
    /*************************************** */
    paramBoolean(key: string, def?: boolean) {
        let value = this.param(key, def);
        if (value as any === 'true' || value === true) return true;
        if (value as any === 'false' || value === false) return false;
        return Boolean(value);
    }
    /*************************************** */
    error404(data?: string | object) {
        return this.error(HttpStatusCode.HTTP_404_NOT_FOUND, data);
    }
    /*************************************** */
    error400(data?: string | object) {
        return this.error(HttpStatusCode.HTTP_400_BAD_REQUEST, data);
    }
    /*************************************** */
    error403(data?: string | object) {
        return this.error(HttpStatusCode.HTTP_403_FORBIDDEN, data);
    }
    /*************************************** */
    async errorLog(namespace: WorkflowNamespace, name: string, meta?: object) {
        await this.log(namespace, name, LogMode.ERROR, meta);
        // errorLog('log', '[ERROR] ' + namespace + ':' + name + ' | ' + var1 + ', ' + var2);
    }
    /*************************************** */
    async infoLog(namespace: WorkflowNamespace, name: string, meta?: object) {
        await this.log(namespace, name, LogMode.INFO, meta);
        // debugLog('log', '[INFO] ' + namespace + ':' + name + ' | ' + var1 + ', ' + var2);
    }
    /*************************************** */
    async log(namespace: WorkflowNamespace, name: string, mode: LogMode, meta?: object) {
        try {
            await Const.DB.models.logs.create({
                name,
                namespace,
                user_id: this.request.user() ? this.request.user().id : undefined,
                ip: this.request.clientIp(),
                mode,
                meta,
                created_at: new Date().getTime(),
            });
        } catch (e) {
            console.trace();
            // errorLog('err6655', e);
        }
    }
    /*************************************** */
    response<T = any>(result?: T, code: HttpStatusCode = HttpStatusCode.HTTP_200_OK, message?: string, applyObjects?: object): [string, HttpStatusCode] {
        // =>if result is not set
        if (result == undefined) {
            result = '' as any;
        }
        let resp: APIResponse = {
            data: result,
            success: false,
            statusCode: code,
            responseTime: (new Date().getTime()) - this.request.startResponseTime,
        }
        if (applyObjects) {
            resp = { ...resp, ...applyObjects };
        }
        // =>check for success response
        if (code >= 200 && code < 300) {
            resp.success = true;
        }
        // =>check for message
        if (message) {
            resp.message = message;
        }

        return [JSON.stringify(resp), code];
    }
    /*************************************** */
    paginateResponse<T = any>(result: T[]): [string, HttpStatusCode] {
        // =>get params
        let pageSize = this.paramNumber('page_size', 10);
        let page = this.paramNumber('page', 1);
        let pagination: APIResponsePagination = {
            page_size: pageSize,
            page,
            page_count: Math.ceil(result.length / pageSize),
        };
        // =>calc offset
        let startOffset = (page * pageSize) - pageSize;
        let endOffset = startOffset + pageSize;
        // =>not enough results
        if (result.length <= startOffset) {
            return this.response([], HttpStatusCode.HTTP_200_OK, undefined, { pagination });
        }
        if (result.length <= endOffset) endOffset = result.length;
        // =>get page of results
        let paginateResults = result.slice(startOffset, endOffset);
        // console.log(result, startOffset, endOffset)
        return this.response(paginateResults, HttpStatusCode.HTTP_200_OK, undefined, { pagination });
    }

    /*************************************** */
    error(code: HttpStatusCode = HttpStatusCode.HTTP_400_BAD_REQUEST, data?: string | object) {
        return this.response(data, code);
    }
    /*************************************** */
    formDataParam<T = string>(key: string, def: T = undefined, isFile = false): T {
        let value: T;
        if (isFile) {
            value = this.request.req['files'][key];
        } else {
            value = this.request.req['fields'][key];
        }
        if (!value) value = def;
        return value;
    }
    /*************************************** */
    allFormDataParams(type: 'files' | 'both' | 'non_files' = 'non_files') {
        let params = {};
        if (type === 'non_files' || type === 'both') {
            if (typeof (this.request.req['fields']) === 'object') {
                for (const key of Object.keys(this.request.req['fields'])) {
                    params[key] = this.request.req['fields'][key];
                }
            }
        }
        if (type === 'files' || type === 'both') {
            if (typeof (this.request.req['files']) === 'object') {
                for (const key of Object.keys(this.request.req['files'])) {
                    params[key] = this.request.req['files'][key];
                }
            }
        }

        return params;
    }
    /*************************************** */
    checkProcessReadAccess(process: WorkflowProcessModel) {
        // =>check owner access
        if (this.checkUserRoleHasAccess([Const.RESERVED_ACCESS_ROLES.OWNER_ACCESS], { process })) return true;
        // =>check read process access
        if (process.workflow?.settings?.read_access_roles && this.checkUserRoleHasAccess(process.workflow?.settings?.read_access_roles, { process })) return true;
        // =>check create process access
        if (process.workflow?.settings?.create_access_roles && this.checkUserRoleHasAccess(process.workflow?.settings?.create_access_roles, { process })) return true;

        return false;
    }
    /*************************************** */
    /*************************************** */
    checkUserRoleHasAccess(roles: string[], options: {
        process?: WorkflowProcessModel,
    } = {}) {
        if (!roles || !Array.isArray(roles) || roles.length === 0) {
            roles = [Const.RESERVED_ACCESS_ROLES.ALL_ACCESS];
        }
        // =>if all access
        if (roles.includes(Const.RESERVED_ACCESS_ROLES.ALL_ACCESS)) {
            return true;
        }
        // =>if owner access
        if (roles.includes(Const.RESERVED_ACCESS_ROLES.OWNER_ACCESS) && options.process) {
            if (options.process.created_by === this.request.user().id) return true;
        }
        // =>if is admin
        if (this.isAdmin()) {
            return true;
        }
        if (!this.request.user().roles) {
            this.request.user().roles = [];
        }
        for (const userRole of this.request.user().roles) {
            if (roles.includes(userRole)) {
                return true;
            }
        }
        return false;
    }
    /*************************************** */
    async findProcessById(id: string) {
        return ProcessHelper.findProcessById(id);
    }
    /*************************************** */
    async getProcess(processId: string): Promise<{ process: WorkflowProcessModel } | [string, HttpStatusCode]> {
        try {
            // =>find process by id
            let process = await this.findProcessById(processId);
            if (!process) return this.error404('not found such process');
            if (!process.workflow) {
                return this.error400('bad process');
            }
            // =>check read or write access on process
            if (!this.checkUserRoleHasAccess(process.workflow?.settings?.read_access_roles, { process }) && !this.checkUserRoleHasAccess(process.workflow?.settings?.create_access_roles, { process })) {
                return this.error403('no access to process info');
            }
            return { process };
        } catch (e) {
            errorLog('err23523575', e);
            return this.error400('bad process');
        }
    }
    /*************************************** */
    async getProcessCurrentState(processId: string, stateName?: string): Promise<{ state: WorkflowState, process: WorkflowProcessModel } | [string, HttpStatusCode]> {
        try {
            let processSt = await this.getProcess(processId);
            // =>if error
            if (Array.isArray(processSt)) {
                return processSt;
            }
            let process = processSt.process;
            if (!stateName) stateName = process.current_state;
            // =>find current state info
            let stateInfo = process.workflow.states.find(i => i.name === stateName);
            // =>check access state
            if (!this.checkUserRoleHasAccess(stateInfo.access_role)) {
                return this.error403('no access to state info');
            }
            return { state: stateInfo, process };
        } catch (e) {
            errorLog('err2352352', e);
            return this.error400('bad process');
        }
    }
    /*************************************** */

    isAdmin() {
        if (!this.request.user()) return false;
        return this.request.user().is_admin;
    }
    /*************************************** */
    async getDeployedWorkflow(name: string, version?: number) {
        let workflow: DeployedWorkflowModel;
        // =>find workflow by name, version
        if (version) {
            workflow = await Const.DB.models.workflows.findOne({
                name,
                version,
            });
        }
        // =>find workflow by name, latest version
        else {
            let workflows = await Const.DB.models.workflows.find({
                name,
            }).sort({ version: -1 }).limit(1);
            if (workflows.length > 0) {
                workflow = workflows[0];
            }
        }

        return workflow;
    }
    /*************************************** */
    async getProcessListByFilters(filters: {
        filter_finished_processes: boolean;
        workflows: string[];
        processes: string[];
        with_fields?: boolean;
        state?: string;
        match_fields?: object;
    }) {
        try {
            let dbFilters: FilterQuery<WorkflowProcessModel> = {};
            if (filters.processes && filters.processes.length > 0) {
                dbFilters._id = {};
                dbFilters._id['$in'] = filters.processes;
            }
            if (filters.workflows && filters.workflows.length > 0) {
                dbFilters.workflow_name = {};
                dbFilters.workflow_name['$in'] = filters.workflows;
            }
            if (filters.state) {
                dbFilters.current_state = filters.state;
            }
            // =>iterate all processes
            let processIds = await Const.DB.models.processes.find(dbFilters, { _id: true });
            if (!processIds) return this.response([]);
            let processes: WorkflowProcessModel[] = [];
            for (const pid of processIds) {
                let processId = pid._id;
                let fields: WorkflowProcessField[];
                let res = await this.getProcessCurrentState(processId);
                // =>if raise error
                if (Array.isArray(res)) {
                    continue;
                }
                // =>fetch process fields
                if (filters.with_fields || filters.match_fields) {
                    let tmpFields = await this.abstractProcessFields(res.process);
                    // =>if allowed
                    if (tmpFields[0]) {
                        fields = tmpFields[1] as any;
                    }
                }
                // =>check read process access
                if (!this.checkUserRoleHasAccess(res.process.workflow?.settings?.read_access_roles, { process: res.process })) {
                    continue;
                }
                // =>if filter end processes
                if (filters.filter_finished_processes && res.process.current_state === res.process.workflow.end_state) {
                    continue;
                }
                // =>truncate data
                let truncateData = this.truncateProcessInfo(res.process);
                // =>check for set fields
                if (filters.with_fields) {
                    truncateData.field_values = fields;
                }
                // =>if match fields
                if (filters.match_fields && Object.keys(filters.match_fields).length > 0) {
                    let isMatch = true;
                    for (const key of Object.keys(filters.match_fields)) {
                        if (!fields.find(i => i.name === key) || fields.find(i => i.name === key).value !== filters.match_fields[key]) {
                            isMatch = false;
                            break;
                        }
                    }
                    if (!isMatch) continue;
                }

                processes.push(truncateData);

            }

            return this.paginateResponse(processes);
        } catch (e) {
            errorLog('err32423', e);
            return this.error400();
        }
    }

    truncateProcessInfo(process: WorkflowProcessModel, fullIsAdmin = false) {
        let newProcess = clone(process);
        // =>check if admin
        if (fullIsAdmin && this.isAdmin()) return newProcess;
        newProcess.workflow = undefined;
        newProcess.field_values = undefined;
        newProcess.history = undefined;
        newProcess.jobs = undefined;
        return newProcess;
    }

    async abstractProcessFields(process: WorkflowProcessModel) {
        // =>check access access to process
        if (!this.checkProcessReadAccess(process)) {
            return [false, this.error403('not allowed to read process fields')];
        }
        return [true, process.field_values];
    }
}