import mongoose from "mongoose";
import { WorkflowProcessModel } from './models';
const metaDataSchema = new mongoose.Schema<WorkflowProcessModel, WorkflowProcessModel>({
    workflow_name: String,
    workflow_version: Number,
    current_state: String,
    field_values: Array,
    history: Array,
    // workflow: [{ type: mongoose.Schema.Types.ObjectId, ref: 'workflows' }],
    workflow: { type: mongoose.Schema.Types.ObjectId, ref: 'workflows' },
    created_at: Number,
    created_by: Number,
    updated_at: Number,
});


export async function getSchema() {
    const processesModel = mongoose.model("processes", metaDataSchema);
    return processesModel;
}