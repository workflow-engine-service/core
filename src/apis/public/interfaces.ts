

export interface UserTokenResponse {
    access_token: string;
    refresh_token: string;
    lifetime: number;
    expired_time: number;
}