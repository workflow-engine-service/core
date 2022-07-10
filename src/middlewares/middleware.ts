import { Request, Response } from "express";
import { APIResponse } from "src/interfaces";
import { CoreRequest } from "../apis/request";
import { debugLog } from "../common";
import { Const } from "../const";
import { HttpStatusCode } from "../types";


export abstract class Middleware {
   /*************************************** */
   constructor() {

   }
   /*************************************** */
   responseError(req: Request, statusCode: HttpStatusCode = HttpStatusCode.HTTP_404_NOT_FOUND, reason?: string) {
      debugLog('middleware_error', `middleware '${this.constructor.name}' error ${statusCode}`);
      this.errorHandler(req, statusCode, reason);
      return false;
   }
   /*************************************** */
   abstract handle(req: Request, res: Response): Promise<boolean>;
   /*************************************** */
   async errorHandler(req: Request, code: HttpStatusCode = HttpStatusCode.HTTP_404_NOT_FOUND, data?: string | object) {
      debugLog('error', `http ${code} error with data: ${data}`);
      if (typeof data === 'string') {
         data = { data };
      }
      let resp: APIResponse = {
         data,
         success: false,
         statusCode: code,
         responseTime: (new Date().getTime()) - req.body[Const.CoreRequestKey].startResponseTime,
      };

      return req.body[Const.CoreRequestKey].response(resp, code);
   }
}
