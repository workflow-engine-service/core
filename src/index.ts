import { InitDB, loadConfigs } from "./common";
import { Const } from "./const";
import { MongoDB } from "./mongo";
import { WebServer } from "./webserver";
import * as fs from 'fs';



async function main() {
    console.log('------------------------------');
    console.log(`WorkFlow Engine Service - Verison ${Const.VERSION}`);
    console.log('------------------------------');
    // =>load configs
    if (!await loadConfigs()) {
        console.log('bad server configs');
        return false;
    }
    // =>create required dirs
    fs.mkdirSync(Const.CONFIGS.server.logs_path, { recursive: true });
    // =>init mongo db
    await InitDB();
    // =>init webserver
    await WebServer.initWebServer();

    return true;
}


main();












