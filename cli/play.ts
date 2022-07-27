import * as LOG from "@dat/lib/log";
import * as ARG from "@dat/lib/argvs";
import * as IN from "@dat/lib/input";
import * as OS from "@dat/lib/os";
import * as TEM from "@dat/lib/template";
import * as SET from "@dat/lib/settings";
import * as path from 'path';
import * as fs from 'fs';
/************************************* */
type CommandName = 'compile' | 'new' | 'sample' | 'install' | 'stop' | 'publish-docs';
type CommandArgvName = 'language' | 'input' | 'output' | 'name' | 'version' | 'overwrite' | 'skip-remove-docker-cache' | 'skip-build-image';
const VERSION = '0.25';
const DOCKER_PROJECT_NAME = 'workflow_engine_saas';
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
               description: 'directory path for generate interface files',
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
      },
      {
         name: 'install',
         description: 'install workflow engine as dockerize',
         alias: 'i',
         implement: async () => await installWorkflow(),
         argvs: [
            {
               name: 'skip-remove-docker-cache',
               alias: 's1',
               description: 'skip to remove docker unused images, containers',
               type: 'boolean',
            },
            {
               name: 'skip-build-image',
               alias: 's2',
               description: 'skip to build workflow image',
               type: 'boolean',
            },
         ],
      },
      {
         name: 'stop',
         description: 'stop workflow docker containers',
         alias: 'stp',
         implement: async () => await stopDocker(),
      },
      // {
      //    name: 'publish-docs',
      //    description: 'build and publish docs by mdbook',
      //    alias: 'pb',
      //    implement: async () => await publishDocs(),
      // },

   ]);
   if (!res) return 1;

   return 0;
}
/*********************************** */
async function installWorkflow() {
   let dockerPath = path.join(await OS.cwd(), 'data', 'docker');

   let dockerTmpPath = path.join(dockerPath, 'tmp');
   let prodConfigsPath = path.join(dockerTmpPath, 'configs.json');
   let sourceRootPath = path.join(await OS.cwd(), '..');
   // =>clear docker cache
   if (!ARG.hasArgv('skip-remove-docker-cache')) {
      LOG.info('remove stopped docker containers ...');
      await OS.shell(`sudo docker rm $(sudo docker ps --filter=status=exited --filter=status=dead -q)`);
      LOG.info('clear unused docker images...');
      await OS.shell(`sudo docker rmi $(sudo docker images --filter "dangling=true" -q --no-trunc)`);
   }
   LOG.info('stop docker services...');
   await stopDocker();
   fs.mkdirSync(dockerTmpPath, { recursive: true });
   // =>copy configs.prod.json to tmp
   if (fs.existsSync(path.join(sourceRootPath, 'configs.prod.json'))) {
      fs.copyFileSync(path.join(sourceRootPath, 'configs.prod.json'), prodConfigsPath);
   } else {
      LOG.warning(`can not find 'configs.prod.json' file to load custom configs`);
      fs.copyFileSync(path.join(dockerPath, 'configs.json'), prodConfigsPath);
   }
   // =>read configs.json
   let configs = JSON.parse(fs.readFileSync(prodConfigsPath).toString());
   // =>read complete configs.json
   let completeConfigs = JSON.parse(fs.readFileSync(path.join(dockerPath, 'configs.json')).toString());
   // =>concat configs.json
   configs = await concatObjects(configs, completeConfigs);
   // =>update configs.json
   configs['mongo']['host'] = 'mongo';
   // =>save configs.json
   fs.writeFileSync(prodConfigsPath, JSON.stringify(configs, null, 2));
   // =>render files
   let renderFiles = ['Dockerfile', 'docker-compose.yml'];
   for (const file of renderFiles) {
      await TEM.saveRenderFile(path.join(dockerPath, file), dockerTmpPath, {
         data: {
            configs,
         },
      });
   }
   // =>build image
   if (!ARG.hasArgv('skip-build-image')) {
      LOG.info('rebuild docker image ...');
      await OS.shell(`sudo docker build -t workflow_engine:latest -f ./cli/data/docker/tmp/Dockerfile .`, sourceRootPath);
   }
   LOG.info('run docker compose...');
   await OS.shell(`sudo docker-compose -f ./docker-compose.yml --project-name ${DOCKER_PROJECT_NAME} up -d --remove-orphans `, dockerTmpPath);

}
/*********************************** */

async function stopDocker() {
   let dokcerPath = path.join(await OS.cwd(), 'data', 'docker');

   let dokcerTmpPath = path.join(dokcerPath, 'tmp');
   await OS.shell(`sudo docker-compose -f ./docker-compose.yml --project-name ${DOCKER_PROJECT_NAME} stop `, dokcerTmpPath);
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
   let langsamplesPath = path.join(await OS.cwd(), 'data', 'samples', lang);
   // =>find language samples
   let sampleWorkflows = fs.readdirSync(langsamplesPath, { withFileTypes: true }).filter(i => i.isDirectory()).map(i => i.name);
   // =>select samples
   let sampleWorkflow = await IN.select('select sample workflow', sampleWorkflows);
   await updateOutputEnv(outputPath, lang);
   await OS.copyDirectory(path.join(langsamplesPath, sampleWorkflow), path.join(outputPath, sampleWorkflow));
   LOG.success(`workflow '${sampleWorkflow}' created in '${outputPath}' collection successfully :)`);
}
/*********************************** */
// async function publishDocs() {
//    let wesDocsPath = path.join(await OS.cwd(), '..', 'docs', 'wes_book');
//    await OS.shell(`mdbook build --dest-dir dist`, wesDocsPath);
//    await OS.shell('git init', path.join(wesDocsPath, 'dist'));
//    await OS.shell('git remote add origin https://github.com/madkne/workflow-engine-serivce-docs', path.join(wesDocsPath, 'dist'));
//    // =>push
//    await OS.shell('git push origin master --force', path.join(wesDocsPath, 'dist'));
// }
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
/*********************************** */


async function concatObjects(obj1: object, completeObj2: object) {
   for (const key of Object.keys(completeObj2)) {
      // console.log('key:', key, obj1[key], completeObj2[key])
      if (obj1[key] === undefined) {
         obj1[key] = completeObj2[key];
      }
      else if (typeof completeObj2[key] === 'object') {
         obj1[key] = await concatObjects(obj1[key], completeObj2[key]);
         // console.log('object key:', key, obj1[key])
      }
   }
   return obj1;
}