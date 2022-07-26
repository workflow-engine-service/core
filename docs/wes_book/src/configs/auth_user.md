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

### properties

| name | type | required | Description |
| ----------- | ----------- |----------- |----------- |
| type | string | YES | can be 'api_based' or 'directly' or 'dual' |
| lifetime | number | YES | in seconds
| url | string | NO | for api_based type | 
| method | string | NO | for api_based type (can be get or post or put) |
| param_name | string | NO | for api_based type (default: access_token) |
| header_name | string | NO | for authenticate user request (default: authentication) |
