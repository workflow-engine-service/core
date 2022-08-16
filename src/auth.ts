import { Const } from "./const";
import * as bcrypt from 'bcrypt';
import { UserModel } from "./models/models";
import { Request } from "express";
import { UserTokenResponse } from "./apis/public/interfaces";
import { errorLog, generateString } from "./common";

export namespace Auth {
    const tokenSign = '0x%wf';
    /********************************* */
    export async function authenticate(username: string, secret_key: string) {
        if (!username || !secret_key) return undefined;
        // =>find user by username
        const user = await Const.DB.models.users.findOne({ name: username });
        // =>if ont exist
        if (!user) return undefined;
        // =>check user password
        if (!await comparePassword(user.secret_key, secret_key)) {
            return undefined;
        }
        return user;
    }
    /********************************* */
    async function comparePassword(hashedPassword: string, simplePassword: string, replaceSlash = false) {
        if (!simplePassword || !hashedPassword) return false;

        if (replaceSlash) {
            // =>replace '||||' with '/'
            hashedPassword = hashedPassword.replace(/\|\|\|\|/g, '/');
        }

        return await bcrypt.compare(simplePassword, hashedPassword);

    }
    /********************************* */
    export async function addSession(user: UserModel, req: Request): Promise<UserTokenResponse> {
        const now = new Date();
        try {
            const expired = new Date();
            expired.setSeconds(now.getSeconds() + Const.CONFIGS.auth_user.lifetime);
            const token = tokenSign + generateString(20);
            const refresh_token = generateString(40);
            // =>create new session
            await Const.DB.models.sessions.create({
                user_id: user.id,
                ip: req.ip,
                user_agent: req.get('user-agent'),
                created_at: now.getTime(),
                token,
                refresh_token,
                expired_token_at: expired.getTime(),
            });
            return {
                access_token: token,
                refresh_token,
                expired_time: expired.getTime(),
                lifetime: Const.CONFIGS.auth_user.lifetime * 1000,
            };
        } catch (e) {
            errorLog('err5454', e);
            return {
                access_token: null,
                refresh_token: null,
                lifetime: 0,
                expired_time: now.getTime(),
            };
        }
    }
    /********************************* */
    export async function encryptPassword(password: string, saltRounds: string | number = 10, replaceSlash = false) {
        let hash = await bcrypt.hash(password, saltRounds);
        if (replaceSlash) {
            // =>replace '/' with '||||'
            hash = hash.replace(/\//g, '||||');
        }
        return hash;
    }
    /********************************* */
    export async function getUserByDirectlyToken(token: string): Promise<UserModel | 'expired' | 'invalid'> {
        // =>check token sign
        if (!token.startsWith(tokenSign)) return 'invalid';
        // =>find user session by token
        const session = await Const.DB.models.sessions.findOne({ token });
        if (!session) return 'invalid';
        // =>check expired token
        if (new Date().getTime() > session.expired_token_at) {
            return 'expired';
        }
        let user = await Const.DB.models.users.findOne({ id: session.user_id });
        // console.log('session:', { session, user })
        // =>if not found user
        if (!user) {
            return 'invalid';
        }
        // =>update session
        session.checked_token_at = new Date().getTime();
        await session.save();

        return user;
    }
    /********************************* */
    export async function getUserByApiToken(token: string): Promise<UserModel | 'expired' | 'invalid'> {
        //TODO:
        return 'invalid';
    }
}