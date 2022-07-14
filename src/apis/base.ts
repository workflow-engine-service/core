import { Const } from "../const";
import { APIResponse, WorkflowState } from "../interfaces";
import { HttpStatusCode, LogMode, RequestMethodType } from "../types";
import { CoreRequest } from "./request";
import { WorkflowProcessModel } from "src/models/models";
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
    async errorLog(namespace: string, name: string, var1?: any, var2?: any) {
        await this.log(namespace, name, LogMode.ERROR, var1, var2);
        // errorLog('log', '[ERROR] ' + namespace + ':' + name + ' | ' + var1 + ', ' + var2);
    }
    /*************************************** */
    async infoLog(namespace: string, name: string, var1?: any, var2?: any) {
        await this.log(namespace, name, LogMode.INFO, var1, var2);
        // debugLog('log', '[INFO] ' + namespace + ':' + name + ' | ' + var1 + ', ' + var2);
    }
    /*************************************** */
    async log(namespace: string, name: string, mode: LogMode, var1?: any, var2?: any) {
        try {
            await Const.DB.models.logs.create({
                name,
                namespace,
                user_id: this.request.user() ? this.request.user().id : undefined,
                ip: this.request.clientIp(),
                mode,
                var1: var1 ? String(var1) : undefined,
                var2: var2 ? String(var2) : undefined,
                created_at: new Date().getTime(),
            });
        } catch (e) {
            console.trace();
            // errorLog('err6655', e);
        }
    }
    /*************************************** */
    response<T = any>(result?: T, code: HttpStatusCode = HttpStatusCode.HTTP_200_OK, message?: string): [string, HttpStatusCode] {
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
    /*************************************** */
    /*************************************** */
    checkUserRoleHasAccess(roles: string[]) {
        if (!roles) {
            roles = ['_all_'];
        }
        if (!roles.includes('_all_') && !roles.includes(this.request.user().role)) {
            return false;
        }
        return true;
    }
    /*************************************** */
    async findProcessById(id: string) {
        let process = await Const.DB.models.processes.findById(id).populate('workflow');
        return process;
    }
    /*************************************** */
    async getProcessCurrentState(processId: string): Promise<{ state: WorkflowState, process: WorkflowProcessModel } | [string, HttpStatusCode]> {
        // =>find process by id
        let process = await this.findProcessById(processId);
        if (!process) return this.error404('not found such process');
        // =>find current state info
        let stateInfo = process.workflow.states.find(i => i.name === process.current_state);
        // =>check access state
        if (!this.checkUserRoleHasAccess(stateInfo.access_role)) {
            return this.error403('no access to state info');
        }
        return { state: stateInfo, process };
    }
}