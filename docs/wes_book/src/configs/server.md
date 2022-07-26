# `server` config namespace

you must define server configs like port or disable document services


sample code:
```json
"server": {
    "port": 8082,
    "host": "0.0.0.0",
    "logs_path": "./logs",
    "uploads_path": "./uploads",
    "debug_mode": false,
    "swagger_disabled": true,
    "wiki_disabled": true
},
```

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
| max_worker_running | number| NO | max workers to async running (default: 10)|

