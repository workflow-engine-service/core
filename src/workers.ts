import { debugLog, generateString } from "./common";
import { WorkerStruct, WorkflowStateActionResponse, WorkflowStateActionSendParameters } from "./interfaces";
import { Subject } from "rxjs";
import { ProcessHelper } from "./apis/processHelper";
import { Const } from "./const";
import { WorkerModel } from "./models/models";

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
                // =>update current state
                params._process.current_state = response.state_name;
                // =>update field values
                // =>add process history
                // =>call 'onInit' event of state
                // =>check for end state
                // =>update process
                return response;
            },
            failedResult: async (response) => {
                //TODO:
                return { error: response.response_message };
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