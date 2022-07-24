import mongoose from "mongoose";
import { UserModel } from './models';
const metaDataSchema = new mongoose.Schema<UserModel, UserModel>({
    id: Number,
    email: String,
    info: Object,
    name: String,
    roles: [String],
    is_admin: {
        type: Boolean,
        default: false,
    },
    secret_key: String,
    created_at: Number,
});

export async function getSchema() {
    const usersModel = mongoose.model("users", metaDataSchema);
    return usersModel;
}