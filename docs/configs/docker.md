# `docker` config namespace

you can define docker configs

> this namespace used just for **production** mode


sample code:
```json
"docker": {
    "mongo_image": "mongo",
    "redis_image": "redis"
}
```

### properties

| name | type | required | Description |
| ----------- | ----------- |----------- |----------- |
| mongo_image | string | NO | docker image used for mongo service (you can use it with tag) |
| redis_image | string | NO | docker image used for redis service |
