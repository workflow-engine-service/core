import { clone, dbLog, debugLog, errorLog, generateString } from "./common";
import { WorkerStruct, WorkflowActiveJob, WorkflowActiveJobSendParameters, WorkflowCreateProcessSendParameters, WorkflowProcessJob, WorkflowProcessResponse, WorkflowStateActionResponse, WorkflowStateActionSendParameters, WorkflowStateJobResponse } from "./interfaces";
import { Subject } from "rxjs";
import { ProcessHelper } from "./apis/processHelper";
import { Const } from "./const";
import { WorkerModel, WorkflowProcessModel } from "./models/models";
import { isMainThread, Worker } from 'worker_threads';
import { WorkflowEvents } from "./events";
import { LogMode } from "./types";

export namespace WebWorkers {
    let workers: WorkerStruct[] = [];
    let workerFinishedEvent = new Subject<any>();
    let workerRunning = 0;
    let maxWorkerRunning = 0;
    /******************************** */
    export async function addActionWorker(params: WorkflowStateActionSendParameters): Promise<string> {
        // =>generate worker id
        let workerId = await addWorker<WorkflowStateActionResponse>({
            type: 'state_action',
            doAction: async () => {
                // =>do action by type
                let functionCallName = 'doActionWithLocal';
                switch (params._action.type) {
                    case 'local':
                        functionCallName = 'doActionWithLocal';
                        break;
                    case 'redis':
                        functionCallName = 'doActionWithRedis';
                        break;
                    case 'hook_url':
                        functionCallName = 'doActionWithHookUrl';
                        break;
                }
                // =>start do action
                let responseFromActionType = await ProcessHelper[functionCallName](params) as WorkflowStateActionResponse;
                debugLog('worker', `response from action by type '${params._action.type}' is: next_state: ${responseFromActionType.state_name}, is_failed: ${responseFromActionType._failed}`);
                // =>check for exist such state
                if (!responseFromActionType._failed && responseFromActionType.state_name && !params._process.workflow.states.find(i => i.name === responseFromActionType.state_name)) {
                    responseFromActionType._failed = true;
                    responseFromActionType.response_message = `[workflow] not exist such state name '${responseFromActionType.state_name}'`;
                }
                // =>check for failed action
                if (responseFromActionType._failed) {
                    return [false, responseFromActionType];
                }
                // =>set fields, if not
                if (!responseFromActionType.fields) {
                    responseFromActionType.fields = {};
                }
                if (params.fields) {
                    for (const key of Object.keys(params.fields)) {
                        responseFromActionType.fields[key] = params.fields[key];
                    }
                }
                // =>set extra fields
                if (params._action.set_fields) {
                    for (const key of Object.keys(params._action.set_fields)) {
                        responseFromActionType.fields[key] = params._action.set_fields[key];
                    }
                }
                //TODO:

                return [true, responseFromActionType];
            },
            successResult: async (response) => {
                debugLog('worker', `success to run action and go to '${response.state_name}' state...`);

                await ProcessHelper.updateProcess(params._process, {
                    newState: response.state_name,
                    workerId,
                    userId: params.user_id,
                    message: params.message,
                    setFields: response.fields,
                    params,
                });

                return response;
            },
            failedResult: async (response) => {
                //TODO:
                return {
                    error: response.response_message,
                    process_id: params.process_id,
                };
            },
            meta: {
                process: params.process_id,
                state: params.state_name,
                action: params.state_action_name,
            },
            priority: 2,
            started_by: params.user_id,
        });


        return workerId;
    }
    /******************************** */
    export async function addJobWorker(params: WorkflowActiveJobSendParameters): Promise<string> {
        // =>generate worker id
        let workerId = await addWorker<WorkflowStateJobResponse>({
            type: 'state_job',
            doAction: async () => {
                let responseFromJob: WorkflowStateJobResponse = {};
                // =>set extra fields
                if (params.set_fields) {
                    responseFromJob.set_fields = params.set_fields;
                }
                // =>if set action
                if (params.action_name) {
                    // =>create action worker
                    let execAction = await ProcessHelper.executeStateAction(params._process, params._state, params.action_name, undefined, params.set_fields, 0);
                    // =>if error
                    if (execAction.error) {
                        responseFromJob.error = execAction.error;
                        return [false, responseFromJob];
                    } else {
                        responseFromJob.actionWorkerId = execAction.workerId;
                    }
                }
                // =>if set next state
                else if (params.state_name) {
                    responseFromJob.next_state = params.state_name;
                }

                return [true, responseFromJob];
            },
            successResult: async (response) => {
                debugLog('worker', `success to run job and go to '${response.next_state}' state...`);
                // =>call 'onJob' event of state
                ProcessHelper.emitStateEvent('onJob', params._process.current_state, params);
                // let newProcess = clone(params._process);
                // =>set fields
                // if (params.set_fields) {

                // }
                // =>update process
                await ProcessHelper.updateProcess(params._process, {
                    newState: params.state_name,
                    workerId,
                    setFields: params.set_fields,
                    params,
                });


                return response;
            },
            failedResult: async (response) => {
                dbLog({
                    namespace: 'job',
                    mode: LogMode.ERROR,
                    name: 'failed_job_worker',
                    meta: { response },
                });
                return {
                    // error: response.response_message,
                    process_id: params.process_id,
                };
            },
            meta: {
                process: params.process_id,
                state: params.state_name,
                // action: params.state_action_name,
            },
            priority: 3,
            started_by: 0,
        });
        return workerId;
    }
    /******************************** */
    export async function addProcessWorker(params: WorkflowCreateProcessSendParameters): Promise<string> {
        // =>generate worker id
        let workerId = await addWorker<WorkflowProcessResponse>({
            type: 'process',
            doAction: async () => {
                try {
                    let responseFromProcess: WorkflowProcessResponse = {};
                    // =>normalize jobs
                    let processJobs: WorkflowProcessJob[] = [];
                    // =>transfer process jobs
                    for (const state of params.workflow.states) {
                        if (!state.jobs) continue;
                        for (const job of state.jobs) {
                            let processJob: WorkflowProcessJob = job as any;
                            if (!processJob._id) {
                                job._id = generateString(12);
                            }
                            processJob.__job_state_name = state.name;
                            // =>add process job
                            processJobs.push(processJob);
                        }
                    }
                    params.jobs = processJobs;
                    // =>create new process
                    let res = await Const.DB.models.processes.create(params);
                    responseFromProcess = {
                        process: res,
                    };
                    params.process_id = res._id;
                    // =>emit event
                    WorkflowEvents.ProcessCreate$.next({
                        process: res,
                        worker_id: workerId
                    });
                    return [true, responseFromProcess];
                } catch (e) {
                    errorLog('err23523534', e);
                    return [false, undefined];
                }
            },
            successResult: async (response) => {
                debugLog('worker', `success to run create process`);
                params.process_id = response.process._id;
                params.user_id = response.process.created_by;
                params._process = response.process;
                let oldProcess = clone<WorkflowProcessModel>(response.process);
                oldProcess.current_state = null;
                await ProcessHelper.updateProcess(oldProcess, {
                    newState: response.process.current_state,
                    workerId,
                    userId: response.process.created_by,
                    params,
                });


                return response;
            },
            failedResult: async (response) => {
                dbLog({
                    namespace: 'process',
                    mode: LogMode.ERROR,
                    name: 'failed_process_worker',
                    meta: { response },
                });
                return {
                    // error: response.response_message,
                    process_id: params.process_id,
                };
            },
            meta: {
                workflow: params.workflow,
            },
            priority: 5,
            started_by: params.created_by,
        });
        return workerId;
    }
    /******************************** */
    async function addWorker<R = {}>(struct: WorkerStruct<R>) {
        if (maxWorkerRunning === 0) {
            maxWorkerRunning = Const.CONFIGS.server.max_worker_running;
        }
        struct.init_at = new Date().getTime();
        // =>add worker to db
        let worker = await Const.DB.models.workers.create(struct);
        struct._id = worker._id;
        debugLog('worker', `added a new worker by id '${struct._id}' by type '${struct.type}'`);
        dbLog({ namespace: 'worker', name: 'add_worker', meta: { struct }, user_id: struct.started_by });
        workers.push(struct);
        return struct._id;
    }
    /******************************** */
    async function updateWorker(worker: WorkerStruct) {
        let data: WorkerModel = {
            init_at: worker.init_at,
            priority: worker.priority,
            type: worker.type,
        };
        if (worker.started_at) {
            data.started_at = worker.started_at;
        }
        if (worker.ended_at) {
            data.ended_at = worker.ended_at;
        }
        if (worker.response) {
            data.response = worker.response;
        }
        if (worker.success !== undefined) {
            data.success = worker.success;
        }
        await Const.DB.models.workers.findByIdAndUpdate(worker._id, { $set: data }, { multi: true, upsert: true }).clone();
    }
    /******************************** */
    export async function start() {
        setInterval(async () => {
            // =>check for new worker
            if (workers.length === 0) return;
            // =>check max worker running
            if (workerRunning >= maxWorkerRunning) {
                return;
            }
            let worker = workers.shift();
            workerRunning++;
            worker.started_at = new Date().getTime();
            // =>update  worker
            await updateWorker(worker);
            debugLog('worker', `start '${worker._id}' worker ...`);
            //TODO:multithreading
            // if (isMainThread) {
            //     const workerThread = new Worker('./child_worker.js', {
            //         workerData: {
            //             worker,
            //         },
            //     });
            //     // Listen for a message from worker
            //     workerThread.once("message", async (res) => {
            //         console.log(`message: ${res}`);
            //         // workerFinishedEvent.next()
            //         // =>if success
            //         worker.success = res[0];
            //         if (res[0]) {
            //             worker.response = await worker.successResult(res[1]);
            //         }
            //         // =>if failed
            //         else {
            //             worker.response = await worker.failedResult(res[1]);
            //         }
            //         worker.ended_at = new Date().getTime();
            //         // =>update  worker
            //         await updateWorker(worker);
            //         workerRunning--;
            //     });
            //     workerThread.on("error", (error) => {
            //         console.log(error);
            //     });
            //     workerThread.on("exit", (exitCode) => {
            //         console.log(exitCode);
            //     });

            // }
            // =>run worker
            worker.doAction().then(async (res) => {
                // =>if success
                worker.success = res[0];
                if (res[0]) {
                    worker.response = await worker.successResult(res[1]);
                }
                // =>if failed
                else {
                    worker.response = await worker.failedResult(res[1]);
                }
                worker.ended_at = new Date().getTime();
                // =>update  worker
                await updateWorker(worker);
                workerRunning--;
            });
        }, 50);
    }

}