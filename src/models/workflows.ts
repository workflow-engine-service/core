import mongoose from "mongoose";
import { DeployedWorkflowModel, UserModel } from './models';
const metaDataSchema = new mongoose.Schema<DeployedWorkflowModel, DeployedWorkflowModel>({
    name: String,
    version: Number,
    start_state: String,
    end_state: String,
    settings: Object,
    fields: Array,
    states: Array,
    created_at: Number,
    created_by: Number,
});

export async function getSchema() {
    const workflowsModel = mongoose.model("workflows", metaDataSchema);
    return workflowsModel;
}