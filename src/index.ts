import { infoLog, InitDB, loadConfigs } from "./common";
import { Const } from "./const";
import { MongoDB } from "./mongo";
import { WebServer } from "./webserver";
import * as fs from 'fs';
import { Redis } from "./redis";



async function main() {
    console.log('---------------------------------------------------');
    console.log(`WorkFlow Engine Service - Verison ${Const.VERSION}`);
    console.log('---------------------------------------------------');
    // =>set server mode
    if (process.argv.length > 2 && (process.argv[2] === 'dev' || process.argv[2] === 'prod')) {
        Const.SERVER_MODE = process.argv[2];
        infoLog('server', `server mode is '${Const.SERVER_MODE}'`);
    }
    // =>load configs
    if (!await loadConfigs()) {
        console.log('bad server configs');
        return false;
    }
    // =>create required dirs
    fs.mkdirSync(Const.CONFIGS.server.logs_path, { recursive: true });
    fs.mkdirSync(Const.CONFIGS.server.tmp_path, { recursive: true });
    // =>init mongo db
    await InitDB();
    // =>init webserver
    await WebServer.initWebServer();
    // =>init redis instances
    await Redis.initRedisInstances();

    return true;
}


main();












