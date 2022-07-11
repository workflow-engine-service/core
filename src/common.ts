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
export async function loadConfigs() {
    try {
        let configsPath = path.join('configs.json');
        if (!fs.existsSync(configsPath)) {
            configsPath = path.join(path.dirname(__filename), 'configs.json');
        }
        let configsFile = JSON.parse(fs.readFileSync(configsPath).toString());
        Const.CONFIGS = configsFile;
        // =>set defaults for properties
        if (!Const.CONFIGS.server.host) {
            Const.CONFIGS.server.host = 'localhost';
        }
        if (!Const.CONFIGS.server.logs_path) {
            Const.CONFIGS.server.logs_path = 'logs';
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
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
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
        let time = new Date().toTimeString().slice(0, 8);
        let date = new Date().toISOString().slice(0, 10).replace(/-/g, '.');
        if (typeof message === 'object') {
            message = JSON.stringify(message);
        }
        fs.writeFileSync(path.join(Const.CONFIGS.server.logs_path, 'info'), `[${date}-${time}] ${name} ${message}\n`, {
            flag: 'a',
        });
    } catch (e) {
        log(`can not write on ${path.join(Const.CONFIGS.server.logs_path, 'info')} file`, 'err455563', 'error');
    }
}
/***************************************** */
export function debugLog(name: string, message: string) {
    // console.log(settings('DEBUG_MODE'))
    if (!Const.CONFIGS.server.debug_mode) return;
    log(message, name, 'debug');
    try {
        let time = new Date().toTimeString().slice(0, 8);
        let date = new Date().toISOString().slice(0, 10).replace(/-/g, '.');
        if (typeof message === 'object') {
            message = JSON.stringify(message);
        }
        fs.writeFileSync(path.join(Const.CONFIGS.server.logs_path, 'debug'), `[${date}-${time}] ${name} ${message}\n`, {
            flag: 'a',
        });
    } catch (e) {
        log(`can not write on ${path.join(Const.CONFIGS.server.logs_path, 'debug')} file`, 'err455563', 'error');
    }
}
/***************************************** */
export function errorLog(name: string, error: any, uid?: string) {
    if (Const.CONFIGS.server.debug_mode && typeof error !== 'string') {
        console.error(error);
    }
    log(error, name, 'error');
    let time = new Date().toTimeString().slice(0, 8);
    let date = new Date().toISOString().slice(0, 10).replace(/-/g, '.');
    if (typeof error === 'object') {
        error = JSON.stringify(error);
    }
    try {
        fs.writeFileSync(path.join(Const.CONFIGS.server.logs_path, 'errors'), `[${date}-${time}] ${name} ${uid}::${error}\n`, {
            flag: 'a',
        });
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