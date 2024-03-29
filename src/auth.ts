import { Const } from "./const";
import * as bcrypt from 'bcrypt';
import { UserModel } from "./models/models";
import { Request } from "express";
import { UserTokenResponse } from "./apis/public/interfaces";
import { dbLog, errorLog, generateString, infoLog } from "./common";
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import * as https from 'https';

export namespace Auth {
    const tokenSign = '0x_wfsrv';
    const cachingAuth: {
        [k: string]: {
            expiredAt?: number;
            userId?: number;
            userName?: string;
        }
    } = {};
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
        try {
            if (!Const.CONFIGS.auth_user.url) return 'invalid';
            let headers = {};
            headers[Const.CONFIGS.auth_user.api_header_name] = token;
            let apiUserIdOrName: number | string;
            // =>remove all expired caches
            let now = new Date().getTime();
            while (true) {
                let isExistExpired = false;
                for (const key of Object.keys(cachingAuth)) {
                    if (cachingAuth[key].expiredAt < now) {
                        delete cachingAuth[key];
                        break;
                    }
                }
                if (!isExistExpired) break;
            }
            // =>check from cache
            if (cachingAuth[token]) {
                if (cachingAuth[token].userId) {
                    apiUserIdOrName = cachingAuth[token].userId;
                } else if (cachingAuth[token].userName) {
                    apiUserIdOrName = cachingAuth[token].userName;
                }
                infoLog('api_auth', `using cache for auth user '${apiUserIdOrName}'`);
            }
            // =>call api
            else {
                let res: AxiosResponse;
                try {
                    res = await axios({
                        httpsAgent: Const.CONFIGS.auth_user.url.startsWith('https') ? new https.Agent({ rejectUnauthorized: false }) : undefined,
                        method: Const.CONFIGS.auth_user.method,
                        url: Const.CONFIGS.auth_user.url,
                        headers,
                        timeout: Const.CONFIGS.auth_user.api_timeout,
                    });
                } catch (e) {
                    errorLog('err123432', e, 0, true);
                }
                // console.log('ffff', res.status, token)
                // =>if failed
                if (!res || res.status > 299) {
                    return 'invalid';
                }
                // =>if success
                let userIdentify = res.data;
                if (userIdentify === undefined || (typeof userIdentify !== 'string' && typeof userIdentify !== 'number')) {
                    dbLog({ name: 'bad__auth_api_res', namespace: 'auth', meta: { res: res.data } });
                    return 'invalid';
                }

                // =>set user id or name
                if (typeof res.data === 'number') {
                    apiUserIdOrName = res.data;
                } else {
                    apiUserIdOrName = String(res.data);
                }
            }
            // =>find user by name or id
            let user: UserModel;
            if (typeof apiUserIdOrName === 'number') {
                user = await Const.DB.models.users.findOne({
                    id: apiUserIdOrName,
                });
            } else {
                user = await Const.DB.models.users.findOne({
                    name: String(apiUserIdOrName)
                });
            }
            // =>cache user
            cachingAuth[token] = {
                expiredAt: now + Const.CONFIGS.auth_user.api_cache_time,
                userId: typeof apiUserIdOrName === 'number' ? apiUserIdOrName : undefined,
                userName: typeof apiUserIdOrName === 'string' ? apiUserIdOrName : undefined,
            };
            // =>if not found user
            if (!user) {
                return 'invalid';
            }

            return user;
        } catch (e) {
            errorLog('err211111', e);
            return 'invalid';
        }
    }
}