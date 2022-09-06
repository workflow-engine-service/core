import { WorkflowCalculator } from "./interfaces";
import { WorkflowProcessModel } from "./models/models";

type WorkflowCalculatorFunctionName = '$add' | '$mul' | '$minus' | '$div';
type WorkflowCalculatorConditionOperatorName = '$eq' | '$gt' | '$lt';

export class WorkflowCalculatorClass {
    protected _process: WorkflowProcessModel;
    private _functionNames: WorkflowCalculatorFunctionName[] = ['$add', '$mul', '$minus', '$div'];
    private _conditionOperatorNames: WorkflowCalculatorConditionOperatorName[] = ['$eq', '$gt', '$lt'];

    /********************* */
    constructor(process: WorkflowProcessModel) {
        this._process = process;
    }
    /********************* */
    async calc<T = any>(schema: WorkflowCalculator): Promise<T> {
        if (!schema) schema = {};
        return this._parseSchema(schema) as any;

    }
    /********************* */
    private async _parseSchema(schema: WorkflowCalculator) {
        let conditionResult: boolean = undefined;
        // =>iterate keys of schema
        for (const key of Object.keys(schema)) {

            // =>if a function
            if (this._functionNames.includes(key as any)) {
                return await this._execFunction(key as any, schema[key]);
            }
            // =>if '$field'
            if (key === '$field') {
                return this._process.field_values.find(i => i.name === schema[key])?.value;
            }
            // =>if '$const'
            if (key === '$const') {
                return schema[key];
            }
            // =>if '$if'
            if (key === '$if') {
                conditionResult = await this._checkCondition(schema.$if);
            }
            // =>if '$then'
            if (key === '$then') {
                if (conditionResult === true) {
                    return this._parseSchema(schema.$then);
                }
            }
            // =>if '$else'
            if (key === '$else') {
                if (conditionResult === false) {
                    return this._parseSchema(schema.$else);
                }
            }
        }
    }
    /********************* */
    protected async _checkCondition(condition: WorkflowCalculator) {
        let logicType = 'and';
        let conditions: WorkflowCalculator[] = [condition];
        if (condition.$or) {
            logicType = 'or';
            conditions = condition.$or;
        }
        if (condition.$and) {
            conditions = condition.$and;
        }
        let conditionResults: boolean[] = [];
        // =>iterate conditions
        for (const cond of conditions) {
            let keys = Object.keys(cond);
            let operator: WorkflowCalculatorConditionOperatorName;
            // =>find operator of condition
            for (const key of keys) {
                if (this._conditionOperatorNames.includes(key as any)) {
                    operator = key as any;
                    break;
                }
            }
            if (!operator) return false;
            // =>parse sides of operator
            let side1 = await this._parseSchema(cond[operator][0]);
            let side2 = await this._parseSchema(cond[operator][1]);
            // =>detect operator
            switch (operator) {
                case '$eq':
                    conditionResults.push(side1 == side2);
                    break;
                case '$gt':
                    conditionResults.push(side1 > side2);
                    break;
                case '$lt':
                    conditionResults.push(side1 < side2);
                    break;
                default:
                    break;
            }
        }
        // =>apply logics
        if (logicType === 'and') {
            let final = true;
            for (const res of conditionResults) {
                final = final && res;
            }
            return final;
        } else if (logicType === 'or') {
            let final = false;
            for (const res of conditionResults) {
                final = final || res;
            }
            return final;
        }



        return false;
    }
    /********************* */
    protected async _checkGtOperator(sides: [WorkflowCalculator, WorkflowCalculator]) {
        let side1 = await this._parseSchema(sides[0]);
        let side2 = await this._parseSchema(sides[1]);
        return side1 == side2;
    }
    /********************* */
    protected async _execFunction(name: WorkflowCalculatorFunctionName, params: WorkflowCalculator[]) {
        let paramValues = [];
        // =parse function params
        for (const param of params) {
            paramValues.push(await this._parseSchema(param));
        }
        // =>detect witch function
        switch (name) {
            case '$add':
                return this._addFunction(paramValues);
            case '$minus':
                return this._minusFunction(paramValues);
            case '$mul':
                return this._mulFunction(paramValues);
            default:
                return 0;
        }
    }
    /********************* */
    protected _addFunction(values: number[]) {
        let sum = 0;
        for (const val of values) {
            if (isNaN(Number(val))) continue;
            sum += Number(val);
        }
        return sum;
    }
    /********************* */
    protected _minusFunction(values: number[]) {
        let minus = 0;
        for (const val of values) {
            if (isNaN(Number(val))) continue;
            minus -= Number(val);
        }
        return minus;
    }
    /********************* */
    protected _mulFunction(values: number[]) {
        let mul = 1;
        for (const val of values) {
            if (isNaN(Number(val))) continue;
            mul *= Number(val);
        }
        return mul;
    }

}