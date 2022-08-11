# State Event

every state of workflow, can have some events. you can see details of state action schema on [here](./workflow/schema.md#workflowstateevent-schema)

you can set `hook_url` url or `redis` channel to emit event on it.

## event names

#### `onInit` event

when current state be this state

#### `onLeave` event

when current state be left this state

#### `onJob` event

when a job of current state executed (after a time)

## event parameters

in every events, sent these parameters:

| name | type | Description |
| ----------- |----------- |----------- |
| process_id | string | current process id |  
| state_name | string | state that raised event from it |  
| fields | object | all field values of process |
| name | string | name of event |  
| user_id | number | user relevant with event |  

