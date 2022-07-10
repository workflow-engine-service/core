import mongoose from "mongoose";
import { WorkflowProcessModel } from './models';
const metaDataSchema = new mongoose.Schema<WorkflowProcessModel, WorkflowProcessModel>({
    id: String,
    workflow_name: String,
    workflow_version: Number,
    current_state: String,
    field_values: Array,
});

export async function getSchema() {
    const processesModel = mongoose.model("processes", metaDataSchema);
    return processesModel;
}