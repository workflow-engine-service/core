import { ServerConfigs } from "./interfaces";
import { MongoDB } from "./mongo";
import { Redis } from "./redis";
import { MiddlewareName } from "./types";

export namespace Const {

    export const VERSION = '0.96';

    export let SERVER_MODE: 'dev' | 'prod' | 'test' = 'dev';

    export let CONFIGS: ServerConfigs;

    export let DB: MongoDB;

    export let AuthenticateUserKey = '_.wf._auth_user_';

    export let CoreRequestKey = '_.wf.core_request';

    export let MIDDLEWARES: MiddlewareName[] = ['RequestInit', 'Authentication', 'RoutingResolver'];

    export let REDIS_INSTANCES: Redis[] = [];

    export enum RESERVED_ACCESS_ROLES {
        ALL_ACCESS = '_all_',
        OWNER_ACCESS = '_owner_',
    }

}