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
type CommandName = 'compile' | 'new' | 'sample';
type CommandArgvName = 'language' | 'input' | 'output' | 'name' | 'version' | 'overwrite';
const VERSION = '0.19';
/*********************************** */

export async function main(): Promise<number> {
   LOG.clear();
   LOG.success(`*** Workflow CLI - version ${VERSION} ***`);
   await SET.showStatistics();


   // =>define argvs of script
   let res = await ARG.define<CommandName, CommandArgvName>([
      {
         name: 'new',
         description: 'create new workflow',
         alias: 'n',
         implement: async () => await newWorkflow(),
         argvs: [
            {
               name: 'name',
               alias: 'n',
               description: 'workflow name',
            },
            {
               name: 'language',
               alias: 'l',
               description: 'language to generate interface files (default: python3)',
               defaultValue: 'python3',
            },
            {
               name: 'version',
               alias: 'v',
               description: 'version of workflow (default : 1)',
               defaultValue: 1,
            },
            {
               name: 'output',
               alias: 'o',
               description: 'directory path for genrate interface files',
            },
            {
               name: 'overwrite',
               alias: 'ow',
               type: 'boolean',
               description: 'overwrite workflow, if exist',
            },
         ],
      },
      {
         name: 'sample',
         description: 'create a sample workflow',
         alias: 's',
         implement: async () => await sampleWorkflow(),
         argvs: [
            {
               name: 'language',
               alias: 'l',
               description: 'language to generate interface files (default: python3)',
               defaultValue: 'python3',
            },
            {
               name: 'output',
               alias: 'o',
               description: 'directory path for genrate interface files',
               defaultValue: './flows',
            },
            // {
            //    name: 'overwrite',
            //    alias: 'ow',
            //    type: 'boolean',
            //    description: 'overwrite workflow, if exist',
            // },
         ],
      }

   ]);
   if (!res) return 1;

   return 0;
}
/*********************************** */
async function compile() {

}
/*********************************** */
async function newWorkflow() {
   // =>Get language
   let lang = ARG.getArgv('language');
   if (!lang) {
      lang = await IN.select('Enter programming language', ['python3']);
   }
   // =>get output path
   let outputPath = ARG.getArgv('output');
   if (!outputPath) {
      outputPath = await IN.input('Enter output path');
   }
   outputPath = path.resolve(outputPath);
   // =>get version
   let version = ARG.getArgv('version');
   // =>get name
   let name = ARG.getArgv('name');
   if (!name) {
      name = await IN.input('Enter workflow name');
   }
   // =>add version to name
   let nameWithVersion = `${name}@v${version}`
   let langDataPath = path.join(await OS.cwd(), 'data', 'interfaces', lang);

   await updateOutputEnv(outputPath, lang);
   let renderData = {
      base_url: 'http://localhost:8082',
      name,
      version,
   };
   // =>create workflow dir
   let workflowPath = path.join(outputPath, nameWithVersion);
   // => if must overwrite
   if (ARG.getArgv('overwrite')) {
      await OS.rmdir(workflowPath);
   }
   // =>check exist workflow dir
   if (!fs.existsSync(workflowPath)) {
      fs.mkdirSync(workflowPath, { recursive: true });
      let files = [
         {
            source: path.join('sample', 'sample_class.py'),
            dest: `${name}.py`,
         },
         {
            source: path.join('sample', 'fields.py'),
            dest: `fields.py`,
         },
         {
            source: path.join('sample', 'states.py'),
            dest: `states.py`,
         },
         // {
         //    source: path.join('sample', 'sample_func.py'),
         //    dest: `run.py`,
         // },
         {
            source: path.join('sample', '__init__.py'),
            dest: `__init__.py`,
         },
         {
            source: path.join('sample', 'setup.py'),
            dest: `setup.py`,
         },
      ];
      // =>render files
      for (const file of files) {
         fs.writeFileSync(path.join(workflowPath, file.dest), (await TEM.renderString(fs.readFileSync(path.join(langDataPath, file.source)).toString(), {
            noCache: true,
            data: renderData,
         })).data);
      }
      // =>add __init__.py file
      // fs.writeFileSync(path.join(workflowPath, '__init__.py'), '');
      LOG.success(`workflow '${nameWithVersion}' created in '${outputPath}' collection successfully :)`);
   } else {
      LOG.warning(`workflow '${nameWithVersion}' before exist and not changed in '${outputPath}' collection`);
   }
}
/*********************************** */
async function sampleWorkflow() {
   // =>Get language
   let lang = ARG.getArgv('language');
   // =>get output path
   let outputPath = ARG.getArgv('output');
   // =>select samples
   let sampleWorkflow = await IN.select('select sample workflow', ['sample_register_user_redis@v1']);
   let langsamplesPath = path.join(await OS.cwd(), 'data', 'samples', lang);
   await updateOutputEnv(outputPath, lang);
   await OS.copyDirectory(path.join(langsamplesPath, sampleWorkflow), path.join(outputPath, sampleWorkflow));
   LOG.success(`workflow '${sampleWorkflow}' created in '${outputPath}' collection successfully :)`);
}
/*********************************** */
/*********************************** */
/*********************************** */
async function updateOutputEnv(outputPath: string, lang: string) {
   let langDataPath = path.join(await OS.cwd(), 'data', 'interfaces', lang);
   // =>create output dir
   fs.mkdirSync(outputPath, { recursive: true });
   // =>if 'lib' exist, rmeove it to update it
   if (fs.existsSync(path.join(outputPath, 'lib'))) {
      await OS.rmdir(path.join(outputPath, 'lib'));
   }
   // =>copy 'lib' folder
   await OS.copyDirectory(path.join(langDataPath, 'lib'), path.join(outputPath, 'lib'));
   let renderData = {
      base_url: 'http://localhost:8082',
   };
   // =>create 'settings.py' file, if not
   if (!fs.existsSync(path.join(outputPath, 'settings.py'))) {
      fs.writeFileSync(path.join(outputPath, 'settings.py'), (await TEM.renderString(fs.readFileSync(path.join(langDataPath, 'settings.py')).toString(), {
         noCache: true,
         data: renderData,
      })).data);
   }
}