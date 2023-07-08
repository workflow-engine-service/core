import { HttpStatusCode } from './../types';
import { Request, Response } from "express";
import { Middleware } from './middleware';
import { Const } from '../const';
import { errorLog, setTimingProfile } from '../common';
import { UserModel } from '../models/models';
import { Auth } from '../auth';
import { WebRoutes } from '../routes';
import * as url from 'url';

export function middleware() {
   return Authentication;
}

export class Authentication extends Middleware {
   req: Request;

   async handle(req: Request, res: Response) {
      this.req = req;
      // =>check if root url
      if (req.path == '/') return true;
      // =>check for exclude urls
      let excludeUrls = [Const.CONFIGS.server.swagger_base_url, Const.CONFIGS.server.wiki_base_url, Const.CONFIGS.server.frontend_url, WebRoutes.assetsBaseUrl];
      for (const url of excludeUrls) {
         if (req.path.startsWith(url)) {
            return true;
         }
      }
      // =>check for exclude apis
      let apis = WebRoutes.getRoutes();
      for (const api of apis) {
         // console.log(req.path, api.absPath)
         if (req.path === api.absPath && api.noAuth) {
            return true;
         }
      }
      // console.log('Authentication....', req.headers[Const.CONFIGS.auth_user.header_name], Const.CONFIGS.auth_user.header_name, req.headers);
      Const.CONFIGS.auth_user.header_name = Const.CONFIGS.auth_user.header_name.toLowerCase();
      // =>check authentication header

      if (req.headers[Const.CONFIGS.auth_user.header_name]) {
         const authToken = req.headers[Const.CONFIGS.auth_user.header_name] as string;
         // console.log('token:', authToken)
         // =>find user session by token
         const userFind = await this.getUserBySessionToken(authToken);
         // console.log('userfind:', userFind)
         if (userFind === 'invalid') {
            return this.responseError(req, HttpStatusCode.HTTP_401_UNAUTHORIZED, 'token not valid');
         }
         else if (userFind === 'expired') {
            return this.responseError(req, HttpStatusCode.HTTP_401_UNAUTHORIZED, 'token expired');
         }
         else {
            req.body[Const.AuthenticateUserKey] = userFind;

         }
      }
      // =>if no have auth
      if (!req.body[Const.AuthenticateUserKey]) {
         errorLog('no_auth_api', JSON.stringify([req.path, req.method]), 0, true);
         // =>return 401 response
         return this.responseError(req, HttpStatusCode.HTTP_401_UNAUTHORIZED, `auth need, set '${Const.CONFIGS.auth_user.header_name}' header on request`);
      }

      return true;
   }
   /***************************************** */
   async getUserBySessionToken(authToken: string): Promise<UserModel | 'expired' | 'invalid'> {
      let startTime = new Date().getTime();
      // =>check if directly method
      if (Const.CONFIGS.auth_user.type === 'directly' || Const.CONFIGS.auth_user.type === 'dual') {
         let res = await Auth.getUserByDirectlyToken(authToken);
         // console.log(res)
         if (res !== 'invalid') {
            setTimingProfile(this.req, 'direct_auth_user', startTime);
            return res;
         }
      }
      // =>check if directly api based
      if (Const.CONFIGS.auth_user.type === 'api_based' || Const.CONFIGS.auth_user.type === 'dual') {
         let res = await Auth.getUserByApiToken(authToken);
         if (res !== 'invalid') {
            setTimingProfile(this.req, 'api_auth_user', startTime);
            return res;
         }
      }
      return 'invalid';
   }
}
