import { Const } from "./const";
import * as redisServer from "redis";
import { ServerRedisConfig } from "./interfaces";
import { debugLog, errorLog } from "./common";

export class Redis {
    protected client: redisServer.RedisClientType;
    /***************************** */
    constructor(config: ServerRedisConfig) {
        const client = redisServer.createClient({
            url: `redis://${config.host}:${config.port}`,
        });
        // TODO:can use username, password
        client.connect();
        debugLog('redis', `connecting to '${config.host}:${config.port}' redis server ...`);
    }
    /***************************** */


    /***************************** */
    /***************************** */
    /***************************** */
    static async initRedisInstances() {
        try {
            debugLog('redis', 'init all redis instances...');
            Const.REDIS_INSTANCES = [];
            for (const key of Object.keys(Const.CONFIGS.redis)) {
                let redisdClass = new Redis(Const.CONFIGS.redis[key]);
                Const.REDIS_INSTANCES.push(redisdClass);
            }
        } catch (e) {
            errorLog('redis', e);
        }
    }
}