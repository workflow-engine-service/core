import { ServerConfigs } from "./interfaces";
import { MongoDB } from "./mongo";

export namespace Const {

    export const VERSION = '0.5';

    export let CONFIGS: ServerConfigs;

    export let DB: MongoDB;

}