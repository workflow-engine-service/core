import * as express from 'express';
import { infoLog, loadConfigs } from '../../src/common';
import * as fs from 'fs';
import { Const } from '../../src/const';
import { InitDB } from '../../src/common';
import { WebServer } from '../../src/webserver';
import mongoose from 'mongoose';
import timekeeper from 'timekeeper';
export default class IntegrationHelpers {

    public async getApp() {

        Const.SERVER_MODE = 'test';
        await loadConfigs();

        // =>reset logs
        fs.rmSync(Const.CONFIGS.server.logs_path, { recursive: true, force: true });

        fs.mkdirSync(Const.CONFIGS.server.logs_path, { recursive: true });
        fs.mkdirSync(Const.CONFIGS.server.tmp_path, { recursive: true });
        // =>init mongo db
        await InitDB();
        // =>init webserver
        await WebServer.initWebServer();
        // // =>init redis instances
        // await Redis.initRedisInstances();
        return WebServer.app;
    }

    public async clearDatabase() {
        await Const.DB.db.dropDatabase();

        console.log('clear the database');
    }

    public static timeTraveling(options: { addHours?: number; addMinutes?: number; }) {
        const DATE_TO_USE = new Date();
        if (options.addHours) {
            DATE_TO_USE.setHours(DATE_TO_USE.getHours() + options.addHours);
        }
        if (options.addMinutes) {
            DATE_TO_USE.setMinutes(DATE_TO_USE.getMinutes() + options.addMinutes);
        }
        const _Date = Date;
        // const gg = new Date(DATE_TO_USE.getTime());
        // global.Date = class extends Date {
        //     constructor(date) {
        //         if (date) {
        //             return super(date) as any;
        //         }

        //         return DATE_TO_USE;
        //     }
        // } as any;
        // global.Date = jest.fn(() => DATE_TO_USE) as any;
        // global.Date.now = jest.fn(() => DATE_TO_USE.getTime())
        // jest.useFakeTimers()
        //     .setSystemTime(DATE_TO_USE);
        timekeeper.travel(DATE_TO_USE);

        return _Date;
    }
}