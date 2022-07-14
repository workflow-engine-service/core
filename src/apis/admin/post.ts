import { Const } from "../../const";
import { WorkflowDescriptor } from "../../interfaces";
import { BaseApi } from "../base";

export function classApi() {
    return AdminPostApi;
}

export class AdminPostApi extends BaseApi {
    async deployWorkflow() {
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
        // =>deploy workflow
        let res = await Const.DB.models.workflows.create({
            name: code.workflow_name,
            version: code.version,
            start_state: code.start_state,
            end_state: code.end_state,
            settings: {
                auto_delete_after_end: code.auto_delete_after_end,
            },
            fields: code.fields,
            states: code.states,
        });
        return this.response(res.toJSON());
    }

    /************************************** */
    async validateWorkflowCode(code: WorkflowDescriptor): Promise<[WorkflowDescriptor, string]> {
        if (!code) return [code, 'undefined code'];
        // =>check workflow name
        if (!code.workflow_name || typeof code.workflow_name !== 'string') return [code, 'bad workflow name'];
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
            return [code, 'not found start state'];
        }
        // =>check for exist end state
        if (!code.states.find(i => i.name === code.end_state)) {
            return [code, 'not found end state'];
        }
        //TODO:
        return [code, undefined];
    }
}