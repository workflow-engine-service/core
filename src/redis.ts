import { Const } from "./const";
import * as redisServer from "redis";
import { ServerRedisConfig } from "./interfaces";
import { debugLog, errorLog, sleep } from "./common";
import { StringDecoder } from "string_decoder";

export class Redis {
    protected client: redisServer.RedisClientType;
    protected name: string;
    /***************************** */
    constructor(name: string, config: ServerRedisConfig) {
        this.client = redisServer.createClient({
            url: `redis://${config.host}:${config.port}`,
        });
        // TODO:can use username, password
        this.name = name;
    }
    /***************************** */
    async connect() {
        await this.client.connect();
        debugLog('redis', `connected '${this.name}' redis server ...`);

    }
    /***************************** */
    getName() {
        return this.name;
    }
    /***************************** */
    async publish<T = object>(channel: string, msg: T) {
        return await this.client.publish(channel, JSON.stringify(msg));
    }
    /***************************** */
    async subscribe<T = object>(channel: string, timeout: number): Promise<{ response: T | string; error?: string; }> {
        return new Promise(async (res) => {

            const subscriber = this.client.duplicate();

            await subscriber.connect();
            await subscriber.subscribe(channel, async (message) => {
                await subscriber.unsubscribe(channel);
                if (message && message[0] === '{' && message[message.length - 1] === '}') {
                    res({ response: JSON.parse(message) });
                } else {
                    res({ response: message });
                }
            });
            // =>set timeout
            for (let i = 0; i < timeout; i++) {
                await sleep();
            }
            res({ response: undefined, error: `redis subscribe channel '${channel}' timeout` });
        });

    }

    /***************************** */
    /***************************** */
    /***************************** */
    static async initRedisInstances() {
        debugLog('redis', 'init all redis instances...');
        Const.REDIS_INSTANCES = [];
        for (const key of Object.keys(Const.CONFIGS.redis)) {
            try {
                let redisClass = new Redis(key, Const.CONFIGS.redis[key]);
                await redisClass.connect();
                Const.REDIS_INSTANCES.push(redisClass);
            } catch (e) {
                errorLog('redis', e);
            }
        }
    }
}