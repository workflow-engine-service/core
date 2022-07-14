import { Request, Response } from "express";
import { Middleware } from "./middleware";
import { WebRoutes } from "../routes";
import { WebServer } from "../webserver";

export function middleware() {
   return RoutingResolver;
}

export class RoutingResolver extends Middleware {

   /*************************************** */
   async handle(req: Request, res: Response) {
      let path = req.path;
      let apis = WebRoutes.getRoutes();
      for (const api of apis) {
         if (req.path === api.absPath && api.includeMiddlewares) {
            for (const middle of api.includeMiddlewares) {
               // =>load middleware class
               const middleClass = await WebServer.loadMiddleware(middle);
               // =>run middleware dynamically!
               const middleResponse = await middleClass['handle'](req, res);
               // =>if response failed!
               if (!middleResponse) {
                  return false;
               }

            }
         }
      }


      return true;
   }

}