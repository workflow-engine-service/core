import mongoose from "mongoose";
import { WorkerModel } from "./models";
const metaDataSchema = new mongoose.Schema<WorkerModel, WorkerModel>({
    type: String,
    priority: Number,
    init_at: Number,
    started_at: Number,
    ended_at: Number,
    response: Object,
    meta: Object,
    success: Boolean,
});

export async function getSchema() {
    const workersModel = mongoose.model("workers", metaDataSchema);
    return workersModel;
}