# Admin Apis

## /api/v1/admin/workflows

## /api/v1/admin/users

## /api/v1/admin/user/add [POST] [DONE]
* parameters:
- id?: number
- name: string
- email?: string
- roles: string[]
- secret_key?: string (for auth user directly)
- info?: object

## /api/v1/admin/deploy-workflow [POST]
* parameters:
- code: json

## /api/v1/admin/workflow/set-state [POST]
* parameters:
- process_hash: string
- state_name: string