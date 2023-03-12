import * as faker from '@faker-js/faker';
import 'jest';
import supertest from 'supertest';
import IntegrationHelpers from '../helpers/Integration-helpers';
import { describe, beforeAll, it, test, expect, afterAll } from '@jest/globals';
import { ServerConfigs, WorkflowDescriptor } from '../../src/interfaces';
import * as fs from 'fs';
import * as path from 'path';
import { absUrl } from '../../src/common';
import { WorkflowJob } from '../../src/jobs';
import { Const } from '../../src/const';
import { WebWorkers } from '../../src/workers';
import { WorkflowEvents } from '../../src/events';
/********************************** */
describe('Process auto delete after end', () => {
    let app: IntegrationHelpers;
    let configs: ServerConfigs;
    let access_token: string;
    let request: supertest.SuperTest<supertest.Test>;
    const sampleWorkflowName = faker.faker.random.word();
    let sampleProcessId: string;
    let sampleWorkflow: WorkflowDescriptor = {
        workflow_name: sampleWorkflowName,
        version: 1,
        start_state: 'start',
        end_state: 'end',
        auto_delete_after_end: true,
        fields: [
            {
                name: 'myfield',
                type: 'number',
            }
        ],
        states: [
            {
                name: 'start',
                actions: [
                    {
                        name: 'approve',
                        required_fields: ['myfield'],
                        type: 'local',
                        next_state: 'end',
                    },
                ],
            },
            {
                name: 'end',
                actions: [],
            }
        ],
    };


    beforeAll(async () => {
        app = new IntegrationHelpers();
        configs = JSON.parse(fs.readFileSync(path.resolve(__filename + '/../../../configs.test.json')).toString());
        request = supertest((await app.getApp()));
    });
    afterAll(async () => {
        await app.clearDatabase();
    });

    it('login as admin user', (done) => {
        request
            .post('/api/v1/token')
            .send({
                username: configs.admin_users[0].username,
                secret_key: configs.admin_users[0].secretkey,
            })
            .expect(200)
            .end((err, res) => {
                if (err) return done(err);
                access_token = JSON.parse(res.text)['data']['access_token'];
                return done();
            });
    });
    it('deploy sample workflow', (done) => {
        request.post('/api/v1/admin/workflow/deploy').send({
            code: sampleWorkflow,
        }).set(configs.auth_user.header_name, access_token).expect(200, done);
    });
    it('create new process', (done) => {
        request.post('/api/v1/workflow/create').send({
            name: sampleWorkflowName,
        }).set(configs.auth_user.header_name, access_token).expect(200).end((err, res) => {
            if (err) return done(err);
            let data = JSON.parse(res.text)['data'];
            // console.log('process:', data)
            expect(data['workflow_name']).toEqual(sampleWorkflowName);
            sampleProcessId = data['_id'];

            return done();
        });
    });

    it("execute 'approve' action of 'start' state", (done) => {
        request.post('/api/v1/workflow/short-action').send({
            state_action: 'approve',
            process_id: sampleProcessId,
            fields: {
                myfield: 20,
            }
        }).set(configs.auth_user.header_name, access_token).expect(200).end((err, res) => {
            if (err) return done(err);
            WorkflowEvents.workerFinished$.subscribe(it => {
                return done();
            });
            // IntegrationHelpers.timeTraveling({ addSeconds: 10 });
            // let data = JSON.parse(res.text)['data'];
            // console.log(data)
        });
    });


    it("check go to 'end' state", async () => {
        IntegrationHelpers.timeTraveling({ addMinutes: 5 });
        let process = await Const.DB.models?.processes?.findById(sampleProcessId);
        expect(process).not.toBeUndefined();
        expect(process?.current_state).toEqual('end');
    });

    it("check auto removed process workers", async () => {
        let workersCount = await Const.DB.models.workers?.count({
            ended_at: { $ne: null },
            meta: { process: sampleProcessId },
        });
        expect(workersCount).toEqual(0);
    });

    it("check auto removed process", async () => {
        IntegrationHelpers.timeTraveling({ addSeconds: 5 });
        let findProcess = await Const.DB.models.processes?.findById(sampleProcessId);
        expect(findProcess).toBeUndefined();
    });
});