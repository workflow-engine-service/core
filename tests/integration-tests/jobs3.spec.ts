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
/********************************** */
describe('Workflow Jobs (with calc)', () => {
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
                        next_state: 'middle',
                    },
                ],
            },
            {
                name: 'middle',
                actions: [],
                jobs: [
                    {
                        time: {
                            minute: {
                                __if: {
                                    __gt: [
                                        { __field: 'myfield' },
                                        {
                                            __const: 10
                                        }
                                    ]
                                },
                                __then: { __field: 'myfield' },
                                __else: { __const: 10 }
                            },
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
    it('deploy sample workflow (includes jobs)', (done) => {
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
            // let data = JSON.parse(res.text)['data'];
            // console.log(data)
            return done();
        });
    });
    it("check job time calculated value", async () => {
        return new Promise((res) => {
            setTimeout(() => {

                let job = WorkflowJob.getActiveJobs().find(i => i.__job_state_name === 'middle');
                // console.log('active jobs:', WorkflowJob.getActiveJobs())
                expect(job?.time?.minute).toEqual(20);
                res(true);
            }, 200);
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
                });
                // console.log(await Const.DB.models.workers.find())
                expect(worker?.length).toEqual(1);
                expect(worker[0].response['next_state']).toEqual('end');
                expect(worker[0].success).toEqual(true);
                res(true);
            }, 600);
        });
    });

    it("check go to 'end' state", async () => {

        let process = await Const.DB.models.processes?.findById(sampleProcessId);
        expect(process).not.toBeUndefined();
        expect(process?.current_state).toEqual('end');
    });

    it("check removed 'start' state jobs", async () => {
        IntegrationHelpers.timeTraveling({ addMinutes: 10 });
        let activeJobs = WorkflowJob.getActiveJobs();
        expect(activeJobs.filter(i => i.__job_state_name === 'start').length).toEqual(0);
    });
});