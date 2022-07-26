# `redis` config namespace

you can define some redis server connections used for redis type of state action

> if you not use any redis server, redis server in docker compose not be loaded! 

sample code:
```json
"redis": {
    "redis1": {
        "host": "127.0.0.1",
        "port": 6379
    }
},
```
for define redis connection, you declare a name for it (like redis1) and define redis properties on it.

### properties

| name | type | required | Description |
| ----------- | ----------- |----------- |----------- |
| host | string | Yes | host name of redis server | 
| port | number | YES | - |