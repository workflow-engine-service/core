import mongoose from "mongoose";
import { SessionModel } from './models';
const metaDataSchema = new mongoose.Schema<SessionModel, SessionModel>({
    ip: String,
    token: String,
    user_id: Number,
    user_agent: String,
    refresh_token: String,
    created_at: Number,
    checked_refresh_token_at: Number,
    checked_token_at: Number,
    expired_token_at: Number,
});

export async function getSchema() {
    const sessionsModel = mongoose.model("sessions", metaDataSchema);
    return sessionsModel;
}