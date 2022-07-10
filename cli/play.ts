import * as LOG from "@dat/lib/log";
import * as ARG from "@dat/lib/argvs";
import * as IN from "@dat/lib/input";
import * as ENV from "@dat/lib/env";
import * as GIT from "@dat/lib/git";
import * as DOCKER from "@dat/lib/docker";
import * as OS from "@dat/lib/os";
import * as TEM from "@dat/lib/template";
import * as SET from "@dat/lib/settings";
import * as path from 'path';
import * as fs from 'fs';
/************************************* */
type CommandName = 'compile';
type CommandArgvName = 'language' | 'input' | 'output';
const VERSION = '0.1';

export async function main(): Promise<number> {
   LOG.clear();
   LOG.success(`*** Workflow CLI - version ${VERSION} ***`);
   await SET.showStatistics();


   // =>define argvs of script
   let res = await ARG.define<CommandName, CommandArgvName>([
      {
         name: 'compile',
         description: 'compile json workflow files to interface files for safe typing',
         alias: 'c',
         implement: async () => await compile(),
         argvs: [
            {
               name: 'language',
               alias: 'l',
               description: 'language to genrate interface files',
               defaultValue: 'python3',
            },
            {
               name: 'input',
               alias: 'i',
               description: 'directory path for read json files',
            },
            {
               name: 'output',
               alias: 'o',
               description: 'directory path for genrate interface files',
            },
         ],
      },

   ]);
   if (!res) return 1;

   return 0;
}

async function compile() {

}