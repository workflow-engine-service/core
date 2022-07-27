# `alias` config namespace

you can define some alias in different types like `hook_url`. and then use it on every where that accept this type with `alias_name` property.


sample code:
```json
"alias": {
    "app_hook": {
        "type": "hook_url",
        "url": "http://app.com/hook",
        "headers": {
            "auth_token": "436gbg45b4by54c45c4"
        }
    },
    "app_redis": {
        "type": "redis",
        "channel": "action",
        "response_channel": "res_action"
    }
},
```

### properties

| name | type | required | Description |
| ----------- | ----------- |----------- |----------- |
| type | string | Yes | [type of alias](#types) | 



#### types

every type of alias has different properties

##### `hook_url`

| name | type | required | Description |
| ----------- | ----------- |----------- |----------- |
|url| string | NO | can be a url like `http://sample.com/hook`. used for 'hook_url' type|
|method| string | NO | can be a request method like 'get' or 'post'. used for 'hook_url' type|
|headers| string[] | NO | headers that can be set on hook request. used for 'hook_url' type|


##### `redis`

| name | type | required | Description |
| ----------- | ----------- |----------- |----------- |
|channel|string|NO| publish channel name. used for 'redis' type|
|response_channel|string|NO| subscribe channel name. used for 'redis' type|
|redis_instance|string|NO| a redis instance name. used for 'redis' type. (default is first instance defined on configs)|