import mongoose from "mongoose";
import { Const } from "./const";
import { DeployedWorkflowModel, LogModel, SessionModel, UserModel, WorkerModel, WorkflowProcessModel } from "./models/models";
import * as fs from 'fs';
import * as path from 'path';
import { debugLog, errorLog, importFile } from "./common";
import { Auth } from "./auth";

export class MongoDB {
    db: mongoose.Connection;
    models: {
        users?: mongoose.Model<UserModel>;
        workflows?: mongoose.Model<DeployedWorkflowModel>;
        processes?: mongoose.Model<WorkflowProcessModel>;
        logs?: mongoose.Model<LogModel>;
        sessions?: mongoose.Model<SessionModel>;
        workers?: mongoose.Model<WorkerModel>;
    } = {};
    modelNames = ['users', 'workflows', 'processes', 'logs', 'sessions', 'workers'];
    constructor() {

    }
    async connect() {
        let uri = `mongodb://${Const.CONFIGS.mongo.host}:${Const.CONFIGS.mongo.port}/${Const.CONFIGS.mongo.name}`;
        // =>if has username, password
        if (Const.CONFIGS.mongo.username && Const.CONFIGS.mongo.password) {
            uri = `mongodb://${encodeURIComponent(Const.CONFIGS.mongo.username)}:${encodeURIComponent(Const.CONFIGS.mongo.password)}@${Const.CONFIGS.mongo.host}:${Const.CONFIGS.mongo.port}/${Const.CONFIGS.mongo.name}?authSource=admin`;
        }
        // console.log('uri:', uri);
        let monogo = await mongoose.connect(
            uri,
            {
                authSource: 'admin',
            });
        this.db = monogo.connection;
        this.db.on("error", console.error.bind(console, "connection error: "));
        this.db.once("open", function () {
            console.log("Connected successfully");
        });
    }

    async initModels() {
        for (const name of this.modelNames) {
            let filePath = path.join(path.dirname(__filename), 'models', name);
            let modelFile = await importFile(filePath);
            if (!modelFile) {
                errorLog('db', `not found model '${name}' in '${filePath}' path`);
                continue;
            }
            this.models[name] = await modelFile['getSchema']();
            debugLog('db', `model '${name}' deployed`);
        }
    }

    async addAdminUsers() {
        debugLog('db', 'adding admin users defined in configs.json ...');
        for (const user of Const.CONFIGS.admin_users) {
            // =>check user exist
            if (await this.models.users.findOne({ name: user.username })) {
                continue;
            }
            // =>add admin user
            await this.models.users.create({
                id: Math.ceil(Math.random() * 2000000) + 1000000,
                email: `${user.username}@service.com`,
                name: user.username,
                secret_key: await Auth.encryptPassword(user.secretkey),
                roles: user.roles || ['_admin_'],
                is_admin: true,
                info: {},
            });
            debugLog('db', `user '${user.username}' created!`);
        }
    }
}