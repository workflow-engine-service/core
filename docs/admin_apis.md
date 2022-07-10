# Admin Apis

## /api/v1/admin/workflows

## /api/v1/admin/users

## /api/v1/admin/user/add [POST]
* parameters:
- id?: number
- name: string
- email?: string
- role: string
- secret_key?: string (for auth user directly)
- info?: object

## /api/v1/admin/token [POST]
* parameters:
- username: string
- userkey: string
* returns:
- access_token: string
- refresh_token: string
- lifetime: number (seconds)
- expired_token: number (timestamp ms)
## /api/v1/admin/refresh-token [POST]
* parameters:
- refresh_token: string
* returns:
- access_token: string
- refresh_token: string
- lifetime: number (seconds)
- expired_token: number (timestamp ms)

## /api/v1/admin/deploy-workflow [POST]
* parameters:
- code: json

## /api/v1/admin/workflow/set-state [POST]
* parameters:
- process_hash: string
- state_name: string