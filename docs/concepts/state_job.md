# State Job

every state can have some jobs that started after state executed. you can see details of state job schema on [here](./workflow/schema.md#workflowstatejob-schema)

after a job started, a worker created for it (that can killed by admin)

every job have  a time structure includes:

- **timestamp** - define a hard code timestamp
- **day** - day of month
- **hour**
- **minute**
- **second**

when current time match to this time structure, job execute.

except `timestamp` property, the other properties set after job started time.

for example:

```json
"jobs": [
    {
        "time": {
            "hour": 1,
            "minute": 30,
        },
        "set_fields": {"my_field": 0}
    }
]
```

if current state of process changes to this state on `12:10`, when job executes is `13:40` and just change value of `my_field` field. and job started reset to `13:40`!

also every job have `repeat` property that in default is zero (0) that means unlimited to repeat (it can be a unlimited cycle) or you can set a number for count of repeat job.

for example:

```json
"jobs": [
    {
        "time": {
            "minute": 5,
        },
        "repeat": 5,
        "set_fields": {"expired": true},
        "state_name": "expired_state"

    }
]
```

after 5 minutes, value of `expired` field set `true` and go to `expired_state` state.

!> after the state changed to another state, all current state jobs will removed.
