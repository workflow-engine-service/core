import { BaseApi } from "../base";

export function classApi() {
    return AdminPostApi;
}

export class AdminPostApi extends BaseApi {
    async deployWorkflow() {
        return this.response({
            msg: 'hello world!',
        });
    }
}