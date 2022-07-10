import mongoose from "mongoose";
import { UserModel } from './models';
const metaDataSchema = new mongoose.Schema<UserModel, UserModel>({
    id: String,
    email: String,
    info: Object,
    name: String,
    role: String,
    is_admin: {
        type: Boolean,
        default: false,
    },
    secret_key: String,
});

export async function getSchema() {
    const usersModel = mongoose.model("users", metaDataSchema);
    return usersModel;
}