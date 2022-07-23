import { parentPort, workerData } from "worker_threads";
import { WorkerStruct } from "./interfaces";

// parentPort.postMessage(runWorker(workerData))
runWorker(workerData);

export async function runWorker(params: {
    worker: WorkerStruct
}) {
    params.worker.doAction().then((res) => {
        parentPort.postMessage(res);
    });
}

