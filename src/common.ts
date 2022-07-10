import * as fs from "fs";
import * as path from "path";
import { Const } from "./const";
import { MongoDB } from "./mongo";

export async function InitDB() {
    console.log('init mongodb ...');
    Const.DB = new MongoDB();
    await Const.DB.connect();
    await Const.DB.initModels();
}

export async function loadConfigs() {
    try {
        let configsPath = path.join('configs.json');
        if (!fs.existsSync(configsPath)) {
            configsPath = path.join(path.dirname(__filename), 'configs.json');
        }
        let configsFile = JSON.parse(fs.readFileSync(configsPath).toString());
        Const.CONFIGS = configsFile;
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
}