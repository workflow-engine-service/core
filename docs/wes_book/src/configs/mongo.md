# `mongo` config namespace

you must define main database connection for workflow engine


sample code:
```json
"mongo": {
    "host": "127.0.0.1",
    "port": 27017,
    "name": "workflow_db",
    "timezone": "Asia/Tehran"
},
```

### properties

| name | type | required | Description |
| ----------- | ----------- |----------- |----------- |
| host | string | Yes | host name of mongo server | 
| port | number | YES | - |
| name | string | YES | database name | 
|username | string | NO | - |
| password | string| NO | -
