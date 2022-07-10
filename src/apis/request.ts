import { Request, Response } from "express";
import { Const } from "../const";
import { UserModel } from "../models/models";
import { HttpStatusCode, RequestMethodType } from "../types";

export class CoreRequest {
   req: Request;
   res: Response;
   method: RequestMethodType = 'GET';
   params: object;
   startResponseTime: number;

   /************************************* */
   constructor(req: Request, res: Response) {
      this.req = req;
      this.res = res;
      // =>set request method
      this.method = req.method.toUpperCase() as any;
   }

   /************************************* */
   get<T = string>(key: string, def: T = undefined): T {
      if (this.params[key] !== undefined && this.params[key] !== null) {
         return this.params[key] as any;
      }
      return def;
   }
   /************************************* */
   calculateResponseTime() {
      if (!this.startResponseTime) return 0;
      // =>get diff of response
      const diff = new Date().getTime() - this.startResponseTime;
      // =>add api calls count
      // GlobalVariables.SERVER_RESPONSE.apiCalls++;
      // =>add response time
      // GlobalVariables.SERVER_RESPONSE.totalResponseTime += diff;
      return diff;
   }
   /************************************* */
   response(body: any, statusCode: HttpStatusCode = HttpStatusCode.HTTP_200_OK) {
      // =>if before send data, ignore
      if (this.res.writableEnded) return;
      // console.log('response:', this.res.statusCode, this.res.writableEnded);
      this.res.status(statusCode).send(body);
      // debugLog('response', `[${statusCode}] ${this.requestType}:${this.req.path}`);
   }
   /************************************* */
   responseFile(path: string, statusCode: HttpStatusCode = HttpStatusCode.HTTP_200_OK) {
      // =>if before send data, ignore
      if (this.res.writableEnded) return;
      // console.log('response:', this.res.statusCode, this.res.writableEnded);
      this.res.status(statusCode).sendFile(path);
      // debugLog('response file', `[${statusCode}] ${path}:${this.req.path}`);
   }
   /************************************* */
   redirect(path: string) {
      // debugLog('request', `redirect from to ${this.requestType}:${path}`);
      // =>if web type
      //TODO:
   }
   /************************************* */
   user<T = UserModel>(): T {
      return this.req.body[Const.AuthenticateUserKey];
   }
   /************************************* */
   async updateUser() {
      if (!this.user()) return false;
      this.req.body[Const.AuthenticateUserKey] = (await Const.DB.models.users.findOne({ id: this.user().id })).toJSON();
      return true;
   }
   /************************************* */
   // async logout() {
   //    // =>get user
   //    const user = this.user();
   //    if (user) {
   //       return await logout(user.id, this.res);
   //    }
   //    return undefined;
   // }
   /************************************* */
   clientIp(): string {
      return this.req.ip || JSON.stringify(this.req.ips);
   }

}