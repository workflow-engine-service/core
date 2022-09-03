import * as express from 'express';
import { BehaviorSubject, Subject } from 'rxjs';

export namespace SampleHookServer {

    export let requests = new BehaviorSubject<{
        path: string;
        method: string;
        req: express.Request
    }>(undefined);

    export let responses = new BehaviorSubject<{
        path: string;
        method: string;
        res: (res: express.Response) => any;
    }>(undefined);

    export function definePOSTMethod(app: express.Express, path: string) {
        listenOnPathMethod(app, path, 'post');
    }

    export function defineGETMethod(app: express.Express, path: string) {
        listenOnPathMethod(app, path, 'get');
    }

    function listenOnPathMethod(app: express.Express, path: string, method: string) {
        app[method](path, (req, res) => {
            // console.log('request body:', req.body);
            requests.next({
                path,
                method: method, req,
            });
            // =>listen on response
            let sub = responses.subscribe((it) => {
                if (!it || it.method !== method || it.path !== path) return;
                sub.unsubscribe();
                it.res(res);
            });
        });
    }

}