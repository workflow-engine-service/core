import * as faker from '@faker-js/faker';
import 'jest';
import supertest from 'supertest';
import IntegrationHelpers from '../helpers/Integration-helpers';
import { describe, beforeAll, it, test, expect, afterAll } from '@jest/globals';
import { ServerConfigs, WorkflowDescriptor } from '../../src/interfaces';
import * as fs from 'fs';
import * as path from 'path';
import { Const } from '../../src/const';
import * as express from 'express';
import { SampleHookServer } from '../helpers/sample-server-helper';
/********************************** */
describe('Workflow Authentication by API', () => {
    let app: IntegrationHelpers;
    let configs: ServerConfigs;
    let access_token: string;
    let request: supertest.SuperTest<supertest.Test>;
    const sampleWorkflowName = faker.faker.random.word();
    let sampleProcessId: string;
    let sampleProcessOwnerId: number;
    const SERVER_PORT = 59998;
    const sampleUserName = faker.faker.name.fullName();
    const sampleUserAccessToken = faker.faker.random.alphaNumeric(20);
    const BASE_URL = 'http://localhost:' + SERVER_PORT;
    let sampleServer: express.Express;
    let sampleWorkflow: WorkflowDescriptor = {
        workflow_name: sampleWorkflowName,
        create_access_roles: ['myuser'],
        version: 1,
        start_state: 'start',
        end_state: 'end',
        states: [
            {
                name: 'start',
                actions: [],
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
        // =>change auth type to 'api_based'
        Const.CONFIGS.auth_user.type = 'dual';
        Const.CONFIGS.auth_user.api_header_name = 'auth';
        Const.CONFIGS.auth_user.url = BASE_URL + '/validation';
        // =>init sample server for hook
        sampleServer = app.sampleServer(SERVER_PORT);
        SampleHookServer.defineGETMethod(sampleServer, '/validation');
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
    it('add new user to workflow', (done) => {
        request.post('/api/v1/admin/user/add').send({
            user: {
                name: sampleUserName,
                roles: ['myuser'],
            }
        }).set(configs.auth_user.header_name, access_token).expect(200, done);
    });
    it('create new process by new user', (done) => {
        let sub = SampleHookServer.requests.subscribe(req => {
            if (!req || req.method !== 'get' || req.path !== '/validation') return;
            // console.log('req:', it)
            // sub.unsubscribe();
            SampleHookServer.responses.next({
                path: '/validation',
                method: 'get',
                res: (res) => res.send(sampleUserName),
            });
        });
        request.post('/api/v1/workflow/create').send({
            name: sampleWorkflowName,
        }).set('auth', sampleUserAccessToken).expect(200).end((err, res) => {
            if (err) return done(err);
            let data = JSON.parse(res.text)['data'];
            // console.log('process:', data)
            expect(data['workflow_name']).toEqual(sampleWorkflowName);
            sampleProcessId = data['_id'];
            sampleProcessOwnerId = data['created_by'];
            return done();
        });
    });


});