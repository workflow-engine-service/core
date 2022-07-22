# Configs

## redis `optional`

define some redis server connections used for redis type of state action
```
"redis": {
    "redis1": {
        "host": "127.0.0.1",
        "port": 6379
    }
},
```

## mongo `required`

main database connection for workflow engine
### properties

| name | type | required | Description |
| ----------- | ----------- |----------- |----------- |
| host | string | Yes | host name of mongo server | 
| port | number | YES | - |
| name | string | YES | database name | 
|username | string | NO | - |
| password | string| NO | -

## server `required`

server configs like port or disable document services

### properties

| name | type | required | Description |
| ----------- | ----------- |----------- |----------- |
| port | number | YES | - |
| host | string | NO | host name of main server (default: `localhost`) | 
| logs_path | string | NO | local logs folder path for store app logs (default: `./logs`) |
| uploads_path | string | NO | uploads folder path for store users upload files (default: `./uploads`) | 
|debug_mode | boolean | NO | activate debug logs |
| wiki_base_url | string| NO | wiki service base url (default: `/wiki`)|| wiki_disabled | boolean| NO | is wiki service disabled?|
| swagger_base_url | string| NO | swagger service base url (default: `/api-docs`)|
| swagger_disabled | boolean| NO | is swagger service disabled?|
| worker_timeout | number| NO | time for wait a worker to get response (default: 30s)|

## admin_users `required`

set admin users on workflow engine as hard coded
you can set custom role for your admin users
```
 "admin_users": [
        {
            "username": "admin",
            "secretkey": "349543jdsfjdsjsd8trf4jv843vj4trhtd655%%^5rhytr",
            "role": "admin"
        }
    ],
```

### properties

| name | type | required | Description |
| ----------- | ----------- |----------- |----------- |
| username | string | YES | - |
| secretkey | string | YES | recommend that admin secret key be very hard | 
| role | string | NO | you can set custom role for your admin user (default: `_admin_`) |

## auth_user `required`
TODO: