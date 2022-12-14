import { DeployedWorkflowModel, UserModel } from "../../models/models";
import { Const } from "../../const";
import { WorkflowDescriptor } from "../../interfaces";
import { BaseApi } from "../base";
import { Auth } from "../../auth";
import { errorLog } from "../../common";
import { ProcessHelper } from "../processHelper";

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
            errorLog('err543245', `invalid workflow deploy: ${validate[1]}`, this.request.user().id);
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
            end_state: code.end_state as string[],
            settings: {
                auto_delete_after_end: code.auto_delete_after_end,
            },
            fields: code.fields,
            states: code.states,
            created_at: new Date().getTime(),
            created_by: this.request.user().id,
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
        } else if (typeof userInfo.id !== 'number') {
            return this.error400('user id must be number');
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
        // =>check for not set reserved access roles
        if (!userInfo.roles) userInfo.roles = [];
        for (const role of userInfo.roles) {
            if (role === Const.RESERVED_ACCESS_ROLES.ALL_ACCESS || role === Const.RESERVED_ACCESS_ROLES.OWNER_ACCESS) {
                return this.error400('user can not have a reserved access role!');
            }
        }
        // console.log('user:', userInfo);
        // =>if set secret key, encrypt it
        if (userInfo.secret_key) {
            userInfo.secret_key = await Auth.encryptPassword(userInfo.secret_key);
        }

        userInfo.created_at = new Date().getTime();

        let addedUser = await Const.DB.models.users.create(userInfo);

        return this.response(addedUser);
    }
    /************************************** */
    async userEdit() {
        // =>check admin access
        if (!this.isAdmin()) {
            return this.error403('just admin allowed');
        }

        let userInfo = this.param<UserModel>('user');
        if (!userInfo || !userInfo.id) return this.error400('you must set specific user id');

        // =>find user by id
        let user = await Const.DB.models.users.findOne({ id: userInfo.id });
        if (!user) {
            return this.error404('user not exist');
        }
        // =>check for not set reserved access roles
        if (!userInfo.roles) userInfo.roles = [];
        for (const role of userInfo.roles) {
            if (role === Const.RESERVED_ACCESS_ROLES.ALL_ACCESS || role === Const.RESERVED_ACCESS_ROLES.OWNER_ACCESS) {
                return this.error400('user can not have a reserved access role!');
            }
        }
        // console.log('user:', userInfo);
        // =>if set secret key, encrypt it
        if (userInfo.secret_key) {
            userInfo.secret_key = await Auth.encryptPassword(userInfo.secret_key);
        }

        userInfo.updated_at = new Date().getTime();
        // =>update user
        await await Const.DB.models.users.findOneAndUpdate({ id: userInfo.id }, userInfo);

        return this.response(userInfo);
    }
    /************************************** */
    async processSetFields() {
        try {
            // =>check admin access
            if (!this.isAdmin()) {
                return this.error403('just admin allowed');
            }
            // =>get params
            let processId = this.param('process_id');
            let fields = this.param('fields', {}, true);
            // =>find process by id
            let res = await this.getProcess(processId);
            if (Array.isArray(res)) return res;
            // =>iterate fields
            for (const key of Object.keys(fields)) {
                // =>validate field
                let respValidate = await ProcessHelper.validateFieldValue(res.process, key, fields[key]);
                if (!respValidate.success) {
                    return this.error400(respValidate.error);
                }
                // =>find field
                let fieldIndex = res.process.field_values.findIndex(i => i.name === key);
                // =>set field
                if (fieldIndex > -1) {
                    res.process.field_values[fieldIndex] = { name: key, value: fields[key] };
                } else {
                    res.process.field_values.push({ name: key, value: fields[key] });
                }
            }
            // =>update process
            res.process.updated_at = new Date().getTime();
            await Const.DB.models.processes.updateOne({
                _id: res.process._id,
            }, {
                $set: {
                    field_values: res.process.field_values,
                },
            }, { multi: true, upsert: true }).clone();

            return this.response(res.process);
        } catch (e) {
            errorLog('process_set_fields', e);
            return this.error400();
        }
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
        if (!code.end_state) return [code, 'bad end state'];
        // =>convert end state to array
        if (typeof code.end_state === 'string') {
            code.end_state = [code.end_state as any];
        }
        // =>check for at least one state
        if (!code.states || !Array.isArray(code.states) || code.states.length < 1) {
            return [code, 'bad define states'];
        }
        // =>check for exist start state
        if (!code.states.find(i => i.name === code.start_state)) {
            return [code, 'not found start state at states array'];
        }
        for (const end of code.end_state) {
            // =>check for exist end state
            if (!code.states.find(i => i.name === end)) {
                return [code, 'not found end state at states array'];
            }
            // =>check start, end states not same
            if (code.start_state === end) {
                return [code, 'start state, end state can not be same'];
            }
        }
        //TODO:
        return [code, undefined];
    }
}