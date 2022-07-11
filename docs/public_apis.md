# Public Apis [deprecated]

> on all apis in header, you can set `Authorization` with user token that validate by app server, after that workflow service, send user token to app server or directly and validate user

## /api/v1/workflow/create
create new process from a workflow
## /api/v1/workflow/list
get list of workflow instances (processes) for this user

## /api/v1/workflow/history?process_hash=34436dsssafdsq2eDR$e&filter=all|approved
get a process hash instance and return states of workflow with transitions by filter

## /api/v1/workflow/fields [GET]
* parameters
    - process_hash: string

## /api/v1/workflow/state-info [GET] [DONE]
* parameters
    - process_id: string

## /api/v1/workflow/actions-info [GET]
> return actions that access this user
* parameters
    - process_id: string

## /api/v1/workflow/action [POST]
- parameters
    - state_action: string
    - process_id: string
    - message?: string
    - fields?: object
    - files?: file[]

## /api/v1/user/token [POST]
> for directly method auth
* parameters:
- username: string
- secret_key: string
* returns:
- access_token: string
- refresh_token: string
- lifetime: number (seconds)
- expired_time: number (timestamp ms)
## /api/v1/user/refresh-token [POST]
> for directly method auth
* parameters:
- refresh_token: string
* returns:
- access_token: string
- refresh_token: string
- lifetime: number (seconds)
- expired_time: number (timestamp ms)