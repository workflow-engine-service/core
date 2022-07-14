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
        let processId = this.param
            ('process_id');
        let res = await this.getProcessCurrentState(processId);
        // =>if raise error
        if (Array.isArray(res)) {
            return res;
        }

        return this.response(res.state);
    }
}