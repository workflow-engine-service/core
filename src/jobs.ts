import { ProcessHelper } from "./apis/processHelper";
import { WorkflowCalculatorClass } from "./calculator";
import { clone, dbLog, errorLog, infoLog } from "./common";
import { Const } from "./const";
import { WorkflowEvents } from "./events";
import { WorkflowActiveJob, WorkflowActiveJobSendParameters, WorkflowStateJob } from "./interfaces";
import { getConfig, getConfigs, removeConfig, setConfig } from "./models/configs";
import { LogMode } from "./types";
import { WebWorkers } from "./workers";

export namespace WorkflowJob {
    let runningActiveJobsCycle = false;
    let activeJobs: WorkflowActiveJob[] = [];
    export async function start() {
        // =>if active job empty, restore it
        if (activeJobs.length === 0) {
            try {
                // activeJobs = await getConfigs<WorkflowActiveJob>('active_process_job');
                activeJobs = await loadActiveJobsFromDB();
                infoLog('job', `restored '${activeJobs.length}' active jobs`);
                dbLog({
                    name: 'restore_active_jobs',
                    namespace: 'job',
                    mode: LogMode.INFO,
                    meta: {
                        jobs_length: activeJobs.length,
                    },
                });
            } catch (e) {
                errorLog('err4e5323443221', e);
            }
        }
        // =>listen on every process state onInit
        WorkflowEvents.ProcessStateOnInit$.subscribe(async it => {
            try {
                if (!it || !it.jobs) return;
                // =>get current state jobs
                let jobs = it.jobs.filter(i => i.__job_state_name === it.current_state);
                let activeJobs: WorkflowActiveJob[] = [];
                // =>normalize jobs
                for (const job of jobs) {
                    job.__job_state_name = it.current_state;
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
                await removeActiveJobsByStateName(it.current_state, String(it._id));
            } catch (e) {
                errorLog('err4e3322', e);
            }
        });

        // =>iterate active jobs, on every 2s
        setInterval(async () => {
            if (runningActiveJobsCycle) return;
            try {
                runningActiveJobsCycle = true;
                for (const job of activeJobs) {
                    // console.log('dbg1', job.state_name, job.process_id)
                    // =>check for repeat limit
                    if (job.repeat > 0 && job.current_repeat >= job.repeat) continue;
                    // =>match job time
                    if (!(await matchJobTime(job, job.started_at))) continue;
                    job.current_repeat++;
                    // console.log('dbg2', JSON.stringify(job, null, 2))
                    // =>normalize send params
                    let sendParams: WorkflowActiveJobSendParameters = job as any;
                    sendParams._process = await ProcessHelper.findProcessById(job.process_id);
                    sendParams._state = sendParams._process.workflow.states.find(i => i.name === sendParams._process.current_state);
                    // =>create new worker
                    let workerId = await WebWorkers.addJobWorker(sendParams);
                    // console.log('dbg3', sendParams.__job_state_name, workerId)
                    // dbLog({
                    //     name: 'run_job_worker',
                    //     namespace: 'job',
                    //     mode: LogMode.INFO,
                    //     meta: {
                    //         workerId,
                    //         job,
                    //     },
                    // });
                    // =>update job started_at
                    job.started_at = new Date().getTime();
                }
            } catch (e) {
                errorLog('err4e532243', e);
            }
            runningActiveJobsCycle = false;

        }, 2 * 1000);
    }
    /****************************** */
    export async function addActiveJobs(jobs: WorkflowActiveJob[]) {
        let addedJobsProcessIds: string[] = [];
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
            // =>parse time (as calc)
            if (Object.keys(job.time).find(i => typeof job.time[i] === 'object')) {
                // =>find process
                let process = await Const.DB.models.processes.findById(job.process_id);
                let calc = new WorkflowCalculatorClass(process);
                const rawTime = clone(job.time);
                // =>convert calc fields
                for (const key of Object.keys(job.time)) {
                    if (typeof job.time[key] === 'object') {
                        job.time[key] = await calc.calc(job.time[key]);
                    }
                }
                dbLog({
                    name: 'parse_job_time',
                    namespace: 'job',
                    mode: LogMode.INFO,
                    meta: {
                        job,
                        raw_time: rawTime,
                        parsed_time: job.time,
                    },
                });


            }
            // =>Add job to active
            activeJobs.push(job);
            if (!addedJobsProcessIds.includes(job.process_id)) {
                addedJobsProcessIds.push(job.process_id);
            }
            // console.log('add job:', job)
        }
        // =>save active jobs on db
        for (const pid of addedJobsProcessIds) {
            updateActiveJobsInDB(pid, 'add');
        }
        // setConfig<WorkflowActiveJob[]>('active_jobs', activeJobs);
    }
    /****************************** */
    export async function removeActiveJobsByStateName(stateName: string, processId: string) {
        let newActiveJobs: WorkflowActiveJob[] = [];
        for (const job of activeJobs) {
            if (processId === job.process_id && stateName === job.__job_state_name) {
                continue;
            }
            newActiveJobs.push(job);
        }
        // dbLog({
        //     name: 'remove_active_jobs',
        //     namespace: 'job',
        //     mode: LogMode.INFO,
        //     meta: {
        //         activeJobs,
        //     },
        // });
        activeJobs = clone(newActiveJobs);
        // =>save active jobs on db
        updateActiveJobsInDB(processId, 'remove');
        // setConfig<WorkflowActiveJob[]>('active_jobs', activeJobs);
    }
    /****************************** */
    export async function removeActiveJobById(id: string) {
        const removeJob = activeJobs.find(i => i._id === id);
        if (!removeJob) return;
        let newActiveJobs = activeJobs.filter(i => i._id !== id);
        activeJobs = clone(newActiveJobs);
        // =>save active jobs on db
        updateActiveJobsInDB(removeJob.process_id, 'remove');
        // setConfig<WorkflowActiveJob[]>('active_jobs', activeJobs);
    }
    /****************************** */
    async function matchJobTime(job: WorkflowStateJob, startedAt: number): Promise<boolean> {
        // =>normalize job time
        let jobTimeDate = calculateJobTime(job, startedAt);
        let nowDate = new Date();
        // =>check if same as last date time
        if (job._last_job_dateTime && Math.abs(job._last_job_dateTime - jobTimeDate.getTime()) <= 500) {
            return false;
        }
        if (nowDate.getTime() >= jobTimeDate.getTime()) {
            job._last_job_dateTime = jobTimeDate.getTime();
            return true;
        }


        return false;
    }

    /****************************** */
    export function getActiveJobs() {
        return activeJobs;
    }
    /****************************** */
    /****************************** */
    /****************************** */
    async function loadActiveJobsFromDB() {
        let activeJobs: WorkflowActiveJob[] = [];
        const allProcessesJobs = await Const.DB?.models?.configs.find({ name: 'active_process_jobs' });
        for (const pjobs of allProcessesJobs) {
            if (typeof pjobs.value === 'string') {
                pjobs.value = JSON.parse(pjobs.value);
            }
            activeJobs.push(...pjobs.value as any);
        }
        return activeJobs;
    }
    /****************************** */
    async function updateActiveJobsInDB(processId: string, mode: 'add' | 'remove' = 'add') {
        // =>filter process active jobs
        const processActiveJobs = activeJobs.filter(i => i.process_id == processId);
        if (processActiveJobs.length === 0) {
            await removeConfig('active_process_jobs', processId);
        } else {
            await setConfig('active_process_jobs', processActiveJobs, processId);
        }

        return processActiveJobs;
    }
    /****************************** */
    function calculateJobTime(job: WorkflowStateJob, startedAt: number): Date {
        let jobTimeDate = new Date(startedAt);
        if (!job.time) return jobTimeDate;
        // =>if timestamp
        if (job.time.timestamp) {
            return new Date(job.time.timestamp as number);
        }
        // =>if day
        if (job.time.day) {
            jobTimeDate.setDate(jobTimeDate.getDate() + (job.time.day as number));
        }
        // =>if hour
        if (job.time.hour) {
            jobTimeDate.setHours(jobTimeDate.getHours() + (job.time.hour as number));
        }
        // =>if minute
        if (job.time.minute) {
            jobTimeDate.setMinutes(jobTimeDate.getMinutes() + (job.time.minute as number));
        }
        // =>if second
        if (job.time.second) {
            jobTimeDate.setSeconds(jobTimeDate.getSeconds() + (job.time.second as number));
        }

        return jobTimeDate;
    }
}