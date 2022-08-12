import { Const } from "../../const";
import { BaseApi } from "../base";

export function classApi() {
    return AdminGetApi;
}

export class AdminGetApi extends BaseApi {
    async usersList() {
        // =>check admin access
        if (!this.isAdmin()) {
            return this.error403('just admin allowed');
        }
        let users = await Const.DB.models.users.find();
        // =>truncate
        for (const user of users) {
            user.secret_key = undefined;
        }
        return this.response(users);
    }

    async getWorkflowSchema() {
        // =>check admin access
        if (!this.isAdmin()) {
            return this.error403('just admin allowed');
        }
        // =>get params
        let name = this.param('workflow_name');
        let version = this.paramNumber('workflow_version', 0);
        // =>find workflow
        let workflow = await this.getDeployedWorkflow(name, version);
        if (!workflow) return this.error404();

        return this.response(workflow);
    }

}