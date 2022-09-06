import { faker } from '@faker-js/faker';
import { WorkflowCalculatorClass } from '../../src/calculator';
import { WorkflowProcessModel } from '../../src/models/models';
/********************************** */
describe('Workflow Calculator', () => {
    let sampleProcess: WorkflowProcessModel = {
        _id: faker.git.commitSha(),
        created_at: new Date().getTime(),
        created_by: 0,
        current_state: 'start',
        history: [],
        updated_at: new Date().getTime(),
        field_values: [
            {
                name: 'fieldnum',
                value: 12,
            },
            {
                name: 'field2',
                value: 'state3',
            },
        ],
        workflow: {

        } as any,
    };
    it('test with simple field value multiply', async () => {
        let calc = new WorkflowCalculatorClass(sampleProcess);
        let res = await calc.calc<number>({
            $mul: [{ $field: "fieldnum" }, { $const: 2 }]
        });
        expect(res).toEqual(12 * 2);
    });
    it('test with simple condition (equal)', async () => {
        let calc = new WorkflowCalculatorClass(sampleProcess);
        let res = await calc.calc<string>({
            $if: {
                $eq: [{ $field: "fieldnum" }, { $const: 5 }]
            },
            $then: { $field: 'field2' },
            $else: { $const: 'state1' },
        });
        expect(res).toEqual('state1');
    });
    it('test with or conditions', async () => {
        let calc = new WorkflowCalculatorClass(sampleProcess);
        let res = await calc.calc<string>({
            $if: {
                $or: [
                    { $eq: [{ $field: "fieldnum" }, { $const: 5 }] },
                    { $gt: [{ $field: "fieldnum" }, { $const: 5 }] },
                ],
            },
            $then: { $field: 'field2' },
            $else: { $const: 'state1' },
        });
        expect(res).toEqual('state3');
    });

});