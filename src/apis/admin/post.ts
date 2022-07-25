import { DeployedWorkflowModel, UserModel } from "../../models/models";
import { Const } from "../../const";
import { WorkflowDescriptor } from "../../interfaces";
import { BaseApi } from "../base";

export function classApi() {
    return AdminPostApi;
}

export class AdminPostApi extends BaseApi {
    async deployWorkflow() {
        // =>check admin access
        if (!this.isAdmin()) {
            return this.error403('just admin allowed');
        }
        let code = this.param<WorkflowDescriptor>('code', undefined, true);

        // =>validate workflow code
        let validate = await this.validateWorkflowCode(code);
        if (validate[1]) {
            return this.error400(validate[1]);
        }
        code = validate[0];
        // =>check duplicate workflow
        if (await Const.DB.models.workflows.findOne({
            name: code.workflow_name,
            version: code.version,
        })) {
            return this.error400('duplicate workflow');
        }
        let deployedWorkflow: DeployedWorkflowModel = {
            name: code.workflow_name,
            version: code.version,
            start_state: code.start_state,
            end_state: code.end_state,
            settings: {
                auto_delete_after_end: code.auto_delete_after_end,
            },
            fields: code.fields,
            states: code.states,
        }
        if (code.create_access_roles) {
            deployedWorkflow.settings.create_access_roles = code.create_access_roles;
        }
        if (code.read_access_roles) {
            deployedWorkflow.settings.read_access_roles = code.read_access_roles;
        }
        if (code.process_init_check) {
            deployedWorkflow.settings.process_init_check = code.process_init_check;
        }
        // =>deploy workflow
        let res = await Const.DB.models.workflows.create(deployedWorkflow);
        return this.response(res.toJSON());
    }
    /************************************** */
    async userAdd() {
        // =>check admin access
        if (!this.isAdmin()) {
            return this.error403('just admin allowed');
        }

        let userInfo = this.param<UserModel>('user');
        if (!userInfo || !userInfo.name) return this.error400('bad user name');
        if (!userInfo.id) {
            while (true) {
                userInfo.id = Math.ceil(Math.random() * 1000);
                if (!await Const.DB.models.users.findOne({ id: userInfo.id })) {
                    break;
                }
            }
        }
        // =>check for duplicate user
        if (await Const.DB.models.users.findOne({
            $or: [
                { id: userInfo.id },
                { name: userInfo.name },
            ]
        })) {
            return this.error400('user exist with id or name');
        }
        // console.log('user:', userInfo);

        userInfo.created_at = new Date().getTime();

        let addedUser = await Const.DB.models.users.create(userInfo);

        return this.response(addedUser);
    }
    /************************************** */
    /************************************** */

    /************************************** */
    async validateWorkflowCode(code: WorkflowDescriptor): Promise<[WorkflowDescriptor, string]> {
        if (!code) return [code, 'undefined code'];
        // console.log(code, typeof code)
        // =>check workflow name
        if (!code.workflow_name || typeof code.workflow_name !== 'string') return [code, `bad workflow name '${code.workflow_name}'`];
        // =>normalize code
        if (!code.version) code.version = 1;
        if (!code.fields) code.fields = [];
        // =>check has start state
        if (!code.start_state || typeof code.start_state !== 'string') return [code, 'bad start state'];
        // =>check has end state
        if (!code.end_state || typeof code.end_state !== 'string') return [code, 'bad end state'];
        // =>check for at least one state
        if (!code.states || !Array.isArray(code.states) || code.states.length < 1) {
            return [code, 'bad define states'];
        }
        // =>check for exist start state
        if (!code.states.find(i => i.name === code.start_state)) {
            return [code, 'not found start state at states array'];
        }
        // =>check for exist end state
        if (!code.states.find(i => i.name === code.end_state)) {
            return [code, 'not found end state at states array'];
        }
        // =>check start, end states not same
        if (code.start_state === code.end_state) {
            return [code, 'start state, end state can not be same'];
        }
        //TODO:
        return [code, undefined];
    }
}