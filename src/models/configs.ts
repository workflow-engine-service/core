import mongoose from "mongoose";
import { Const } from "../const";
import { ConfigName } from "../types";
import { ConfigModel } from './models';
const metaDataSchema = new mongoose.Schema<ConfigModel, ConfigModel>({
    name: String,
    value: mongoose.SchemaTypes.Mixed,
    type: String,
    updated_at: {
        type: Number,
    },
});

export async function getSchema() {
    const configsModel = mongoose.model("configs", metaDataSchema);
    return configsModel;
}

export async function setConfig<T = string>(name: ConfigName, value: T) {
    let type = 'string';
    switch (typeof value) {
        case 'number':
            type = 'number';
            break;
        case 'object':
            type = 'json';
            break;
        default:
            break;
    }
    let config: ConfigModel = {
        name,
        value: value as any,
        type: type as any,
        updated_at: new Date().getTime(),
    };
    // =>check exist config
    let configDB: ConfigModel;
    if (await Const.DB?.models?.configs.exists({ name })) {
        configDB = await Const.DB?.models?.configs.findOneAndUpdate({ name }, config);
    } else {
        configDB = await Const.DB?.models?.configs.create(config);
    }
    return configDB;
}

export async function getConfig<T = string>(name: ConfigName, def?: T): Promise<T> {
    // =>find by name
    const conf = await Const.DB?.models?.configs.findOne({ name });
    if (conf) {
        return conf.value as any;
    }

    return def;
}