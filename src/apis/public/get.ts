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
        let processId = this.param('process_id');
        // =>find process by id
        let process = await Const.DB.models.processes.findById(processId).populate('workflow');
        if (!process) return this.error404();
        // console.log(process, process.workflow.name)
        // =>find current state info
        let stateInfo = process.workflow.states.find(i => i.name === process.current_state);
        // =>check access state
        if (!this.checkUserRoleHasAccess(stateInfo.access_role)) {
            return this.error403('no access to state info');
        }


        return this.response(stateInfo);
    }
}