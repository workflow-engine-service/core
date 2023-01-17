import { Subject } from "rxjs";
import { WorkerModel, WorkflowProcessModel } from "./models/models";


export namespace WorkflowEvents {
    export const ProcessStateOnInit$ = new Subject<WorkflowProcessModel>();
    export const ProcessStateOnLeave$ = new Subject<WorkflowProcessModel>();
    export const ProcessCreate$ = new Subject<{ process: WorkflowProcessModel, worker_id: string }>();
    export const workerFinished$ = new Subject<WorkerModel>();

}