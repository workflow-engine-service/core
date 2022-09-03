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
describe('Workflow hook Actions', () => {
    let app: IntegrationHelpers;
    let configs: ServerConfigs;
    let access_token: string;
    let request: supertest.SuperTest<supertest.Test>;
    const sampleWorkflowName = faker.faker.random.word();
    let sampleProcessId: string;
    let sampleProcessOwnerId: number;
    const SERVER_PORT = 59999;
    const BASE_URL = 'http://localhost:' + SERVER_PORT;
    let sampleServer: express.Express;
    let sampleWorkflow: WorkflowDescriptor = {
        workflow_name: sampleWorkflowName,
        version: 1,
        start_state: 'start',
        end_state: 'end',
        fields: [
            {
                name: 'email',
                type: 'string'
            }
        ],
        states: [
            {
                name: 'start',
                actions: [
                    {
                        name: 'approve',
                        type: 'hook_url',
                        method: 'post',
                        required_fields: ['email'],
                        url: BASE_URL + '/approve'
                    }
                ],
            },
            {
                name: 'end',
                events: [
                    {
                        name: 'onInit',
                        type: 'hook_url',
                        method: 'post',
                        url: BASE_URL + '/event'
                    }
                ],
                actions: [],
            }
        ],
    };

    beforeAll(async () => {
        app = new IntegrationHelpers();
        configs = JSON.parse(fs.readFileSync(path.resolve(__filename + '/../../../configs.test.json')).toString());
        request = supertest((await app.getApp()));
        // =>init sample server for hook
        sampleServer = app.sampleServer(SERVER_PORT);
        SampleHookServer.definePOSTMethod(sampleServer, '/approve');
        SampleHookServer.definePOSTMethod(sampleServer, '/event');
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
            sampleProcessOwnerId = data['created_by'];
            return done();
        });
    });

    it("execute 'approve' action ", (done) => {
        request.post('/api/v1/workflow/short-action').send({
            state_action: 'approve',
            process_id: sampleProcessId,
            fields: {
                email: faker.faker.internet.email(),
            }
        }).set(configs.auth_user.header_name, access_token).expect(200).end((err, res) => {
            if (err) return done(err);
            // let data = JSON.parse(res.text)['data'];
            // console.log(data)
            return done();
        });
    });

    it('check call hook url for action', (done) => {
        let sub = SampleHookServer.requests.subscribe(it => {
            if (!it || it.method !== 'post' || it.path !== '/approve') return;
            sub.unsubscribe();
            // console.log('request:', it.req.body)
            expect(it.req.body['process_id']).toEqual(sampleProcessId);
            expect(it.req.body.owner_id).toEqual(sampleProcessOwnerId);
            return done();
        });
    });

    it("go to 'end' state by hook API", (done) => {
        SampleHookServer.responses.next({
            path: '/approve',
            method: 'post',
            res: (res) => res.send('end'),
        });
        // =>check go to next state
        request.get('/api/v1/workflow/process-info').query({ 'process_id': sampleProcessId }).set(configs.auth_user.header_name, access_token).expect(200).end((err, res) => {
            if (err) return done(err);
            setTimeout(() => {
                let data = JSON.parse(res.text)['data'];
                // console.log(data)
                expect(data['current_state']).toEqual('end');
                return done();
            }, 100);
        });
    });

    it("check raised 'onInit' event", (done) => {
        let sub1 = SampleHookServer.requests.subscribe(req => {
            if (!req || req.method !== 'post' || req.path !== '/event') return;
            console.log('request:', req.req.body)
            // sub1.unsubscribe();
            expect(req.req.body['process_id']).toEqual(sampleProcessId);
            expect(req.req.body['state_name']).toEqual('end');
            expect(req.req.body.owner_id).toEqual(sampleProcessOwnerId);
            return done();
        });
    });
});