# `auth_user` config namespace

you must define set authenticate configs


sample code:
```json
"auth_user": {
    "type": "directly",
    "lifetime": 86400,
    "param_name": "access_token"
},
```

## properties

| name | type | required | Description |
| ----------- | ----------- |----------- |----------- |
| type | string | YES | can be 'api_based' or 'directly' or 'dual' |
| lifetime | number | YES | in seconds
| url | string | NO | for api_based type | 
| method | string | NO | for api_based type (can be get or post or put) |
| api_header_name | string | NO | header name for send access token for API url for api_based type (default: Authorization) |
| api_timeout | number | NO | timeout for call api endpoint for api_based type (default: 2000 ms) |
| header_name | string | NO | for authenticate user request (default: Authorization) |

## `api_based` type

if you want to set API based authenticate or `dual` type, you must set these fields:

- **url** set API url like `http://localhost:3000/api/validation`

and also set these fields optionally:

- **method** for call API endpoint

- **api_header_name** set user `access_token` in header with which name.

also response of your API endpoint must be a string that indicate `user_id` or `user_name` defined in workflow add user API endpoint.