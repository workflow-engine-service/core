# State Job

every state can have some jobs that started after state executed. you can see details of state action schema on [here](./workflow/schema.md#workflowstatejob-schema)

after a job started, a worker created for it (that can killed by admin)

every job can schedule with `static` type or `weekly` or `daily` or `hourly` or `minutely` and some times like:
```
"jobs": [
    {
        "type": "daily",
        "times": [
            {
                "hour": 5,
            }
            {
                "hour": 15,
                "minute": 30,
            }
        ],
        "set_fields": {"my_field": 0}
    }
]
```

every day in `5:00` and `15:30`, `my_field` will be reset!


you can also another type named `afterTime`. this type execute job after a passed time. like 5 hours after current state started 

```
"jobs": [
    {
        type: "afterTime",
        times: [
            {
                hour: 5,
            }
        ],
        "set_fields": {"expired": true},
        "action_name": "expired_state"

    }
]

```
