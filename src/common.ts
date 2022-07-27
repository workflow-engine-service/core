import * as fs from "fs";
import * as path from "path";
import { Const } from "./const";
import { MongoDB } from "./mongo";
/***************************************** */
export async function InitDB() {
    infoLog('db', 'init mongodb ...');
    Const.DB = new MongoDB();
    await Const.DB.connect();
    await Const.DB.initModels();
    await Const.DB.addAdminUsers();
}
/***************************************** */
function findConfigsFile(useDev = false) {
    let configsPath: string;
    let configFilename = 'configs.json';
    // =>if dev mode
    if (Const.SERVER_MODE === 'dev' || useDev) {
        configFilename = 'configs.dev.json';
    }
    // =>if prod mode
    else if (Const.SERVER_MODE === 'prod') {
        configFilename = 'configs.json';

    }
    configsPath = path.join(configFilename);
    if (!fs.existsSync(configsPath)) {
        configsPath = path.join(path.dirname(__filename), configFilename);
    }
    if (!fs.existsSync(configsPath)) {
        configsPath = path.join(path.dirname(__filename), '..', 'docker', 'configs', configFilename);
    }

    return configsPath;
}
/***************************************** */
export async function loadConfigs() {
    try {
        let configsPath = findConfigsFile();
        // =>if server mode prod and not exist configs
        if (!fs.existsSync(configsPath) && Const.SERVER_MODE === 'prod') {
            configsPath = findConfigsFile(true);
        }
        if (fs.existsSync(configsPath)) {
            let configsFile = JSON.parse(fs.readFileSync(configsPath).toString());
            Const.CONFIGS = configsFile;
        } else {
            errorLog('configs', `can not load configs.json file from '${configsPath}'! (using fallback mode)`);
            Const.CONFIGS = {
                server: {} as any,
                admin_users: [],
                auth_user: {} as any,
                mongo: {} as any,
            };
        }
        // =>set defaults for properties
        if (!Const.CONFIGS.server.host) {
            Const.CONFIGS.server.host = 'localhost';
        }
        if (!Const.CONFIGS.server.logs_path) {
            Const.CONFIGS.server.logs_path = 'logs';
        }
        if (!Const.CONFIGS.server.uploads_path) {
            Const.CONFIGS.server.uploads_path = 'uploads';
        }
        if (!Const.CONFIGS.auth_user.header_name) {
            Const.CONFIGS.auth_user.header_name = 'Authorization';
        }
        if (!Const.CONFIGS.server.wiki_base_url) {
            Const.CONFIGS.server.wiki_base_url = '/wiki';
        }
        if (!Const.CONFIGS.server.swagger_base_url) {
            Const.CONFIGS.server.swagger_base_url = '/api-docs';
        }
        if (!Const.CONFIGS.server.worker_timeout) {
            Const.CONFIGS.server.worker_timeout = 30;
        }
        if (!Const.CONFIGS.server.max_worker_running) {
            Const.CONFIGS.server.max_worker_running = 10;
        }
        if (!Const.CONFIGS.redis) {
            Const.CONFIGS.redis = {};
        }
        if (!Const.CONFIGS.alias) {
            Const.CONFIGS.alias = {};
        }

        // =>if 'prod' server mode
        if (Const.SERVER_MODE === 'prod') {
            if (Const.CONFIGS.server.host === 'localhost' || Const.CONFIGS.server.host === '127.0.0.1') {
                Const.CONFIGS.server.host = '0.0.0.0';
            }
            Const.CONFIGS.server.debug_mode = false;
            Const.CONFIGS.server.logs_path = './logs';
            // Const.CONFIGS.mongo.host = 'mongo';
            // if (Object.keys(Const.CONFIGS.redis).length > 0) {
            //     Const.CONFIGS.redis[Object.keys(Const.CONFIGS.redis)[0]].host = 'redis';
            // }
        }
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
}
/***************************************** */
export function applyAliasConfig<T = object>(obj: T): T {

    if (!obj) return {} as any;
    if (!obj['alias_name']) return obj;
    // =>find alias properties
    let aliasObject = Const.CONFIGS.alias[obj['alias_name']];
    // =>check type
    if (obj['type'] !== aliasObject['type']) return obj;
    // =>set alias properties
    for (const key of Object.keys(aliasObject)) {
        obj[key] = aliasObject[key];
    }
    if (!aliasObject) return obj;


    return obj;
}
/***************************************** */
function log(text: string, label?: string, type: 'info' | 'error' | 'normal' | 'debug' = 'normal') {
    let dateTime = new Date();
    let time = dateTime.toTimeString().slice(0, 8);
    let date = dateTime.toISOString().slice(0, 10).replace(/-/g, '.');
    let message = `[${date}-${time}:${dateTime.getMilliseconds()}] : ${text}`;
    if (label) {
        message = `[${date}-${time}:${dateTime.getMilliseconds()}] ${label} : ${text}`;
    }
    if (type === 'error') {
        console.error("\x1b[31m\x1b[1m" + message);
    } else if (type === 'info') {
        console.log("\x1b[34m\x1b[1m" + message);
    } else if (type === 'debug') {
        console.log("\x1b[33m\x1b[1m" + message);
    } else {
        console.log(message);
    }
}
/***************************************** */
export function infoLog(name: string, message: string) {
    log(message, name, 'info');
    try {
        if (typeof message === 'object') {
            message = JSON.stringify(message);
        }
        writeLogOnFile('info', `${name} ${message}`);

    } catch (e) {
        log(`can not write on ${path.join(Const.CONFIGS.server.logs_path, 'info')} file`, 'err455563', 'error');
    }
}
/***************************************** */
export function debugLog(name: string, message: string) {
    // console.log(settings('DEBUG_MODE'))
    if (!Const.CONFIGS || !Const.CONFIGS.server.debug_mode) return;
    log(message, name, 'debug');
    try {
        if (typeof message === 'object') {
            message = JSON.stringify(message);
        }
        writeLogOnFile('debug', `${name} ${message}`);
    } catch (e) {
        log(`can not write on ${path.join(Const.CONFIGS.server.logs_path, 'debug')} file`, 'err455563', 'error');
    }
}
/***************************************** */
export function errorLog(name: string, error: any, uid?: string) {
    if (Const.CONFIGS && Const.CONFIGS.server.debug_mode && typeof error !== 'string') {
        console.error(error);
    }
    log(error, name, 'error');
    if (typeof error === 'object') {
        error = JSON.stringify(error);
    }
    writeLogOnFile('errors', `${name} ${uid}::${error}`);
}
/***************************************** */
function writeLogOnFile(type = 'info', text: string) {
    try {
        let time = new Date().toTimeString().slice(0, 8);
        let date = new Date().toISOString().slice(0, 10).replace(/-/g, '.');
        if (Const.CONFIGS && Const.CONFIGS.server) {
            fs.writeFileSync(path.join(Const.CONFIGS.server.logs_path, type + '.log'), `[${date}-${time}] ${text}\n`, {
                flag: 'a',
            });
        }
    } catch (e) {
        log(`can not write on ${path.join(Const.CONFIGS.server.logs_path, 'errors')} file`, 'err4553', 'error');
    }
}
/***************************************** */
export function generateString(length = 10, includeNumbers = true, includeChars = true) {
    var result = '';
    var characters = '';
    if (includeChars) {
        characters += 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    }
    if (includeNumbers) {
        characters += '0123456789';
    }
    if (!includeChars && !includeNumbers) {
        characters += '-';
    }
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}
/***************************************** */
export async function sleep(timeout = 1000) {
    return new Promise((res) => {
        setTimeout(() => {
            res(true);
        }, timeout);
    });
}