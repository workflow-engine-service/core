import { ServerConfigs } from "./interfaces";
import { MongoDB } from "./mongo";

export namespace Const {

    export const VERSION = '0.20';

    export let CONFIGS: ServerConfigs;

    export let DB: MongoDB;

    export let AuthenticateUserKey = '_.wf._auth_user_';

    export let CoreRequestKey = '_.wf.core_request';

    export let MIDDLEWARES = ['RequestInit', 'Authentication'];
}