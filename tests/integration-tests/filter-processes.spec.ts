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
import * as express from 'express';
import { SampleHookServer } from '../helpers/sample-server-helper';
/********************************** */
describe('Workflow filter processes API', () => {
    let app: IntegrationHelpers;
    let configs: ServerConfigs;
    let access_token: string;
    let request: supertest.SuperTest<supertest.Test>;
    const sampleWorkflowName = faker.faker.random.word();
    let sampleProcessId: string;
    let sampleProcessOwnerId: number;
    let sampleServer: express.Express;
    let sampleWorkflow: WorkflowDescriptor = {
        workflow_name: sampleWorkflowName,
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
                        next_state: 'end'
                    }
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
            sampleProcessOwnerId = data['created_by'];
            return done();
        });
    });

    it("find process by call filter API", (done) => {
        request.post('/api/v1/workflow/filter').send({
            workflows: [sampleWorkflowName],
            processes: [sampleProcessId],
        }).set(configs.auth_user.header_name, access_token).expect(200).end((err, res) => {
            if (err) return done(err);
            let data = JSON.parse(res.text)['data'];
            // console.log(data)
            expect(data.length).toEqual(1);
            expect(data[0].current_state).toEqual('start');
            expect(data[0]._id).toEqual(sampleProcessId);
            return done();
        });

    });
});