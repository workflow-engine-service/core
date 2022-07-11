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
        if (!code.version) code.version = 1;
        if (!code.fields) code.fields = [];
        //TODO:
        return [code, undefined];
    }
}