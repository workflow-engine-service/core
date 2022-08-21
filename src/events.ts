import { Subject } from "rxjs";
import { WorkflowProcessModel } from "./models/models";


export namespace WorkflowEvents {
    export const ProcessStateOnInit$ = new Subject<WorkflowProcessModel>();
    export const ProcessStateOnLeave$ = new Subject<WorkflowProcessModel>();
    export const ProcessCreate$ = new Subject<{ process: WorkflowProcessModel, worker_id: string }>();
}