import { Request, Response } from "express";
import { Middleware } from "./middleware";
import * as fs from 'fs';
import * as path from 'path';
import { CoreRequest } from "../apis/request";
import { Const } from '../const';


export function middleware() {
   return RequestInit;
}


export class RequestInit extends Middleware {
   path: string;
   appName: string;

   /**************************************** */
   async handle(req: Request, res: Response) {
      this.path = req.path;
      // =>init core request
      req.body[Const.CoreRequestKey] = new CoreRequest(req, res);
      req.body[Const.CoreRequestKey].startResponseTime = new Date().getTime();

      return true;
   }
}