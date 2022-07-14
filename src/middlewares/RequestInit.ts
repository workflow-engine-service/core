import { Request, Response } from "express";
import { Middleware } from "./middleware";
import * as fs from 'fs';
import * as path from 'path';
import { CoreRequest } from "../apis/request";
import { Const } from '../const';
import { debugLog } from "../common";


export function middleware() {
   return RequestInit;
}


export class RequestInit extends Middleware {
   path: string;
   appName: string;

   /**************************************** */
   async handle(req: Request, res: Response) {
      this.path = req.path;
      let request = new CoreRequest(req, res);
      // =>init core request
      req.body[Const.CoreRequestKey] = request;
      req.body[Const.CoreRequestKey].startResponseTime = new Date().getTime();
      debugLog('request', `[${request.method}] request from ${request.clientIp()} to '${this.path}'`);

      return true;
   }
}