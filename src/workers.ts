import { debugLog, generateString } from "./common";
import { WorkerStruct, WorkflowStateActionResponse, WorkflowStateActionSendParameters } from "./interfaces";
import { Subject } from "rxjs";
import { ProcessHelper } from "./apis/processHelper";
import { Const } from "./const";
import { WorkerModel } from "./models/models";
import { isMainThread, Worker } from 'worker_threads';

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
                // =>call 'onLeave' event of state
                ProcessHelper.emitStateEvent('onLeave', params._process.current_state, params);

                // =>add process history
                params._process.history.push({
                    before_state: params._process.current_state,
                    current_state: response.state_name,
                    created_at: new Date().getTime(),
                    user_id: params.user_id,
                    message: params.message,
                    worker_id: workerId,
                    changed_fields: (await ProcessHelper.collectChangedFields(params, response.fields)),
                });

                // =>update current state
                params._process.current_state = response.state_name;
                // =>update field values
                if (!response.fields) response.fields = {};
                for (const key of Object.keys(response.fields)) {
                    let index = params._process.field_values.findIndex(i => i.name === key);
                    if (index < 0) {
                        params._process.field_values.push({
                            name: key,
                            value: undefined,
                        });
                        index = params._process.field_values.length - 1;
                    }
                    params._process.field_values[index].value = response.fields[key];
                }
                // =>call 'onInit' event of state
                ProcessHelper.emitStateEvent('onInit', params._process.current_state, params);
                // =>check for end state
                //TODO:
                // =>update process
                await Const.DB.models.processes.findByIdAndUpdate(params.process_id, { $set: params._process }, { multi: true, upsert: true }).clone();
                return response;
            },
            failedResult: async (response) => {
                //TODO:
                return {
                    error: response.response_message,
                    process_id: params.process_id,
                };
            },
            priority: 2,
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
        }, 100);
    }

}