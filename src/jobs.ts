import { ProcessHelper } from "./apis/processHelper";
import { dbLog, errorLog } from "./common";
import { Const } from "./const";
import { WorkflowEvents } from "./events";
import { WorkflowActiveJob, WorkflowActiveJobSendParameters, WorkflowStateJob, WorkflowStateJobTime } from "./interfaces";
import { LogMode } from "./types";
import { WebWorkers } from "./workers";

export namespace WorkflowJob {
    let runningActiveJobsCycle = false;
    let activeJobs: WorkflowActiveJob[] = [];
    export async function start() {
        // =>listen on every process state onInit
        WorkflowEvents.ProcessStateOnInit$.subscribe(async it => {
            try {
                if (!it || !it.jobs) return;
                // =>get current state jobs
                let jobs = it.jobs.filter(i => i.__job_state_name === it.current_state);
                let activeJobs: WorkflowActiveJob[] = [];
                // =>normalize jobs
                for (const job of jobs) {
                    job['process_id'] = String(it._id);
                    activeJobs.push(job as any);
                }
                // =>add jobs
                await addActiveJobs(activeJobs);
            } catch (e) {
                errorLog('err4e5322', e);
            }

        });
        // =>listen on every process state onLeave
        WorkflowEvents.ProcessStateOnLeave$.subscribe(async it => {
            try {
                // =>remove old state active jobs
                await removeActiveJobsByStateName(it.current_state);
            } catch (e) {
                errorLog('err4e3322', e);
            }
        });

        // =>iterate active jobs, on every 500 ms
        setInterval(async () => {
            if (runningActiveJobsCycle) return;
            try {
                runningActiveJobsCycle = true;
                for (const job of activeJobs) {
                    // =>check for repeat limit
                    if (job.repeat > 0 && job.current_repeat >= job.repeat) continue;
                    let date = new Date()
                    // =>match job time
                    if (!await matchJobTime(job, job.started_at)) continue;
                    job.current_repeat++;

                    // =>normalize send params
                    let sendParams: WorkflowActiveJobSendParameters = job as any;
                    sendParams._process = await ProcessHelper.findProcessById(job.process_id);
                    sendParams._state = sendParams._process.workflow.states.find(i => i.name === sendParams._process.current_state);
                    // =>create new worker
                    let workerId = await WebWorkers.addJobWorker(sendParams);
                    dbLog({
                        name: 'run_job_worker',
                        namespace: 'job',
                        mode: LogMode.INFO,
                        meta: { workerId, job },
                    });
                    // =>update job started_at
                    job.started_at = new Date().getTime();
                }
            } catch (e) {
                errorLog('err4e532243', e);
            }
            runningActiveJobsCycle = false;

        }, 500);
    }
    /****************************** */
    export async function addActiveJobs(jobs: WorkflowActiveJob[]) {
        for (const job of jobs) {
            if (!job._id) {
                errorLog('err43322', `job no have any _id: ${JSON.stringify(job)}`);
                continue;
            }
            // =>set started_at
            job.started_at = new Date().getTime();
            // =>normalize
            job.current_repeat = 0;
            if (!job.repeat) job.repeat = 0;
            // =>check not exist such job
            if (activeJobs.find(i => i._id === job._id)) {
                // =>just update started_at
                activeJobs.find(i => i._id === job._id).started_at = new Date().getTime();
                continue;
            }
            // =>Add job to active
            activeJobs.push(job);
            // console.log('add job:', job)
        }
    }
    /****************************** */
    export async function removeActiveJobsByStateName(stateName: string) {
        //TODO:
    }
    /****************************** */
    async function matchJobTime(job: WorkflowStateJob, startedAt: number): Promise<boolean> {
        // =>normalize job time
        let jobTimeDate = calculateJobTime(job, startedAt);
        let nowDate = new Date();

        if (nowDate.getTime() >= jobTimeDate.getTime()) {
            return true;
        }


        return false;
    }
    /****************************** */
    function calculateJobTime(job: WorkflowStateJob, startedAt: number): Date {
        let jobTimeDate = new Date(startedAt);
        if (!job.time) return jobTimeDate;
        // =>if timestamp
        if (job.time.timestamp) {
            return new Date(job.time.timestamp);
        }
        // =>if day
        if (job.time.day) {
            jobTimeDate.setDate(jobTimeDate.getDate() + job.time.day);
        }
        // =>if hour
        if (job.time.hour) {
            jobTimeDate.setHours(jobTimeDate.getHours() + job.time.hour);
        }
        // =>if minute
        if (job.time.minute) {
            jobTimeDate.setMinutes(jobTimeDate.getMinutes() + job.time.minute);
        }
        // =>if second
        if (job.time.second) {
            jobTimeDate.setSeconds(jobTimeDate.getSeconds() + job.time.second);
        }

        return jobTimeDate;
    }
    /****************************** */
    export function getActiveJobs() {
        return activeJobs;
    }
}