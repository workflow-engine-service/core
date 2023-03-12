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
import { WorkerModel } from '../../src/models/models';
/********************************** */
describe('Multiple Workflows Jobs (state-based)', () => {
    let app: IntegrationHelpers;
    let configs: ServerConfigs;
    let access_token: string;
    let request: supertest.SuperTest<supertest.Test>;
    const sampleWorkflowNames = [faker.faker.random.word(), faker.faker.random.word(), faker.faker.random.word()];
    let sampleProcessIds: string[] = [];
    let sampleWorkflow: WorkflowDescriptor = {
        workflow_name: 'name',
        version: 1,
        start_state: 'start',
        end_state: 'end',
        states: [
            {
                name: 'start',
                actions: [
                    {
                        name: 'approve',
                        type: 'local',
                        next_state: 'end',
                    }
                ],
                jobs: [
                    {
                        // after 20 min to run job
                        time: {
                            minute: 20,
                        },
                        state_name: 'end'
                    }
                ]
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
    // beforeEach(() => {
    //     jest.useFakeTimers()
    // });
    // afterEach(() => {
    //     jest.runOnlyPendingTimers()
    //     jest.useRealTimers()
    // });
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
    it('deploy first workflow (includes jobs)', (done) => {
        sampleWorkflow.workflow_name = sampleWorkflowNames[0];
        request.post('/api/v1/admin/workflow/deploy').send({
            code: sampleWorkflow,
        }).set(configs.auth_user.header_name, access_token).expect(200, done);
    });
    it('deploy second workflow (includes jobs)', (done) => {
        sampleWorkflow.workflow_name = sampleWorkflowNames[1];
        request.post('/api/v1/admin/workflow/deploy').send({
            code: sampleWorkflow,
        }).set(configs.auth_user.header_name, access_token).expect(200, done);
    });
    // it('deploy third workflow (includes jobs)', (done) => {
    //     sampleWorkflow.workflow_name = sampleWorkflowNames[2];
    //     request.post('/api/v1/admin/workflow/deploy').send({
    //         code: sampleWorkflow,
    //     }).set(configs.auth_user.header_name, access_token).expect(200, done);
    // });

    it('create new process for first workflow', (done) => {
        request.post('/api/v1/workflow/create').send({
            name: sampleWorkflowNames[0],
        }).set(configs.auth_user.header_name, access_token).expect(200).end((err, res) => {
            if (err) return done(err);
            let data = JSON.parse(res.text)['data'];
            // console.log('process:', data)
            expect(data['workflow_name']).toEqual(sampleWorkflowNames[0]);
            sampleProcessIds.push(data['_id']);
            return done();
        });
    });

    it('create new process for second workflow', (done) => {
        request.post('/api/v1/workflow/create').send({
            name: sampleWorkflowNames[1],
        }).set(configs.auth_user.header_name, access_token).expect(200).end((err, res) => {
            if (err) return done(err);
            let data = JSON.parse(res.text)['data'];
            // console.log('process:', data)
            expect(data['workflow_name']).toEqual(sampleWorkflowNames[1]);
            sampleProcessIds.push(data['_id']);
            return done();
        });
    });


    it("check add 'start' state jobs of all processes", async () => {
        return new Promise((res) => {
            setTimeout(() => {
                let activeJobs = WorkflowJob.getActiveJobs();
                // console.log('active jobs:', activeJobs, sampleProcessId)
                expect(activeJobs.length).toEqual(2);
                expect(activeJobs[0].process_id).toEqual(sampleProcessIds[0]);
                expect(activeJobs[0].state_name).toEqual('end');

                expect(activeJobs[1].process_id).toEqual(sampleProcessIds[1]);
                expect(activeJobs[1].state_name).toEqual('end');
                res(true);
            }, 100);
        });
    });
    it("check execute 'approve' action after 20 minutes", async () => {
        return new Promise((res) => {
            IntegrationHelpers.timeTraveling({ addMinutes: 20 });
            setTimeout(async () => {
                let worker = await Const.DB.models.workers?.find({
                    type: 'state_job',
                    meta: { $exists: true },
                    "meta.state": 'end',
                }) as WorkerModel[];
                // console.log(await Const.DB.models.workers.find())
                expect(worker?.length).toEqual(2);
                expect((worker[0].response as any)['next_state']).toEqual('end');
                expect(worker[0].success).toEqual(true);
                res(true);
            }, 400);
        });
    });

    it("check go to 'end' state of all workflows", async () => {
        let firstProcess = await Const.DB.models.processes?.findById(sampleProcessIds[0]);
        // console.log(firstProcess);
        expect(firstProcess).not.toBeUndefined();
        expect(firstProcess?.current_state).toEqual('end');
        let secondProcess = await Const.DB.models.processes?.findById(sampleProcessIds[1]);
        // console.log(secondProcess);
        expect(secondProcess).not.toBeUndefined();
        expect(secondProcess?.current_state).toEqual('end');

    });

    it("check removed 'start' state jobs", async () => {
        IntegrationHelpers.timeTraveling({ addMinutes: 10 });
        let activeJobs = WorkflowJob.getActiveJobs();
        expect(activeJobs.filter(i => i.__job_state_name === 'start').length).toEqual(0);
    });
});