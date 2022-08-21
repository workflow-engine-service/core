import { DeployedWorkflowModel, UserModel } from "../../models/models";
import { Const } from "../../const";
import { WorkflowDescriptor } from "../../interfaces";
import { BaseApi } from "../base";
import { Auth } from "../../auth";

export function classApi() {
    return AdminDeleteApi;
}

export class AdminDeleteApi extends BaseApi {
    /************************************** */
    async userDelete() {
        // =>check admin access
        if (!this.isAdmin()) {
            return this.error403('just admin allowed');
        }
        // =>get params
        let userId = this.paramNumber('id');
        // =>find user by id
        let userInfo = Const.DB.models.users.find({ id: userId });
        if (!userInfo) return this.error404('not found user');
        // =>delete user
        await userInfo.deleteOne();

        return this.response();
    }
}