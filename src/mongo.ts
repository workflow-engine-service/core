import mongoose from "mongoose";
import { Const } from "./const";
import { DeployedWorkflowModel, UserModel, WorkflowProcessModel } from "./models/models";
import * as fs from 'fs';
import * as path from 'path';

export class MongoDB {
    db: mongoose.Connection;
    models: {
        users?: mongoose.Model<UserModel>;
        workflows?: mongoose.Model<DeployedWorkflowModel>;
        processes?: mongoose.Model<WorkflowProcessModel>;
    } = {};
    modelNames = ['users', 'workflows', 'processes'];
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
            let filePath = path.join(path.dirname(__filename), 'models', name + '.js');
            if (!fs.existsSync(filePath)) {
                console.warn(`not found model '${name}'`);
                continue;
            }
            let modelFile = await import(filePath);
            this.models[name] = await modelFile['getSchema']();
            console.log(`model '${name}' deployed`);
        }
    }

    async addAdminUsers() {
        console.log('adding admin users defined in configs.json ...');
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
                secret_key: user.userkey,
                role: '__admin__',
                is_admin: true,
                info: {},
            });
            console.log(`user '${user.username}' created!`);
        }
    }
}