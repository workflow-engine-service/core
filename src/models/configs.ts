import mongoose from "mongoose";
import { Const } from "../const";
import { ConfigName } from "../types";
import { ConfigModel } from './models';
const metaDataSchema = new mongoose.Schema<ConfigModel, ConfigModel>({
    name: String,
    second_name: String,
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

export async function setConfig<T = string>(name: ConfigName, value: T, second_name?: string) {
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
        second_name,
        value: value as any,
        type: type as any,
        updated_at: new Date().getTime(),
    };
    // =>check exist config
    let configDB: ConfigModel;
    // =>if exist second_name
    if (second_name) {
        if (await Const.DB?.models?.configs.exists({ name, second_name })) {
            configDB = await Const.DB?.models?.configs.findOneAndUpdate({ name, second_name }, config);
        } else {
            configDB = await Const.DB?.models?.configs.create(config);
        }
    }
    else {
        if (await Const.DB?.models?.configs.exists({ name })) {
            configDB = await Const.DB?.models?.configs.findOneAndUpdate({ name }, config);
        } else {
            configDB = await Const.DB?.models?.configs.create(config);
        }
    }
    return configDB;
}

export async function removeConfig(name: ConfigName, second_name?: string) {
    if (second_name) {
        return await Const.DB?.models?.configs.deleteMany({ name, second_name });
    }
    return await Const.DB?.models?.configs.deleteMany({ name });
}

export async function getConfig<T = string>(name: ConfigName, def?: T): Promise<T> {
    // =>find by name
    const conf = await Const.DB?.models?.configs.findOne({ name });
    if (conf) {
        if (conf.type === 'json' && typeof conf.value === 'string') conf.value = JSON.parse(conf.value);
        return conf.value as any;
    }

    return def;
}

export async function getConfigs<T = string>(name: ConfigName, def: T[] = []): Promise<T[]> {
    // =>find by name
    const conf = await Const.DB?.models?.configs.find({ name });
    if (conf && conf.length > 0) {
        let values: T[] = [];
        for (const el of conf) {
            if (el.type === 'json' && typeof el.value === 'string') el.value = JSON.parse(el.value);
            values.push(el.value as any);
        }
        return values;
    }

    return def;
}