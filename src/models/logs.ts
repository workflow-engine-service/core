import mongoose from "mongoose";
import { LogModel } from './models';
const metaDataSchema = new mongoose.Schema<LogModel, LogModel>({
    namespace: String,
    name: String,
    user_id: Number,
    ip: String,
    mode: Number,
    created_at: {
        type: Number,
    },
    meta: Object,
});

export async function getSchema() {
    const logsModel = mongoose.model("logs", metaDataSchema);
    return logsModel;
}