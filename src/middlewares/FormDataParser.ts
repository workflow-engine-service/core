import { Request, Response } from "express";
import { Middleware } from "./middleware";
import * as fs from 'fs';
import * as path from 'path';
import { CoreRequest } from "../apis/request";
import { Const } from '../const';
import * as os from 'os';
import busboy from 'busboy';

import { WebServer } from "../webserver";
import { randomFillSync } from "crypto";


export function middleware() {
   return FormDataParser;
}


export class FormDataParser extends Middleware {

   /**************************************** */
   async handle(req: Request, res: Response) {
      return new Promise<boolean>((resolve) => {

         const random = (() => {
            const buf = Buffer.alloc(16);
            return () => randomFillSync(buf).toString('hex');
         })();
         let coreRequest = req.body[Const.CoreRequestKey] as CoreRequest;
         coreRequest.req['fields'] = {};
         coreRequest.req['files'] = {};

         const bb = busboy({ headers: req.headers });
         bb.on('file', (name, file, info) => {
            const saveTo = path.join(Const.CONFIGS.server.uploads_path, `tmp-upload-${random()}`);
            file.pipe(fs.createWriteStream(saveTo));
            coreRequest.req['files'][name] = info;
            coreRequest.req['files'][name]['tmp_path'] = saveTo;
         });
         bb.on('field', (name, val, info) => {
            coreRequest.req['fields'][name] = val;
            console.log(`Field [${name}]: value: %j`, val);
         });
         bb.on('close', () => {
            // console.log('Done parsing form!');
            // res.writeHead(303, { Connection: 'close', Location: '/' });
            // res.end();
            resolve(true);
         });
         req.pipe(bb);
         // const form = formidable({
         //    multiples: true,
         //    uploadDir: Const.CONFIGS.server.uploads_path,
         // });
         // form.parse(req, (err, fields, files) => {
         //    console.log(err, fields, files);
         // });
         //   form.parse(req, (err, fields, files) => {
         //     if (err) {
         //       next(err);
         //       return;
         //     }
         //     res.json({ fields, files });
         //   });

         // return true;
      });

   }
}