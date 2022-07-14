import { generateString } from "./common";
import { WorkerStruct, WorkflowStateActionResponse, WorkflowStateActionSendParameters } from "./interfaces";
import { Subject } from "rxjs";
import { ProcessHelper } from "./apis/processHelper";

export namespace WebWorkers {
    let workers: WorkerStruct[] = [];
    let workerFinishedEvent = new Subject<any>();
    let workerRunning = false;
    /******************************** */
    export async function addActionWorker(params: WorkflowStateActionSendParameters): Promise<string> {
        // =>generate worker id
        let workerId = await addWorker<WorkflowStateActionResponse>({
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
                // =>check for failed action
                if (responseFromActionType._failed) {
                    return [false, responseFromActionType];
                }
                // =>set fields, if not
                if (!responseFromActionType.fields) {
                    responseFromActionType.fields = {};
                }
                // =>set  extra fields
                if (params._action.set_fields) {
                    for (const key of Object.keys(params._action.set_fields)) {
                        responseFromActionType.fields[key] = params._action.set_fields[key];
                    }
                }
                //TODO:

                return [true, responseFromActionType];
            },
            successResult: async (response) => {
                // =>call 'onLeave' event of state
                // =>update current state
                // =>update field values
                // =>add process history
                // =>call 'onInit' event of state
                // =>check for end state
                return true;
            },
            failedResult: async (response) => {
                //TODO:
                return true;
            },
            priority: 2,
        });


        return workerId;
    }
    /******************************** */
    async function addWorker<R = {}>(struct: WorkerStruct<R>) {
        struct.started_at = new Date().getTime();
        let id = generateString(20);
        struct.id = id;
        workers.push(struct);
        return id;
    }
    /******************************** */
    export async function start() {
        setInterval(async () => {
            // =>check for new worker
            if (workers.length === 0) return;
            let worker = workers.shift();
            workerRunning = true;
            // =>run worker
            let res = await worker.doAction();
            // =>if success
            if (res[0]) {
                await worker.successResult(res);
            }
            // =>if failed
            else {
                await worker.failedResult(res);
            }
            //TODO:
        }, 100);
    }

}