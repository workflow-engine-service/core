# State Action Response

when you use `hook_url` or `redis` types for state action, your server receive an object that contains (send parameters):

| name | type | Description |
| ----------- | ----------- |----------- |
| state_name | string | state name | 
| state_action_name | string | state action name | 
| workflow_name | string | workflow name | 
| workflow_version | number | workflow version | 
| process_id | number | current process id | 
| user_id | number | user that call this action | 
| owner_id | number | user that create this process | 
| message | string | message that user send on call this action  | 
| required_fields | [WorkflowProcessField[]](../process/schema.md#workflowprocessfield-schema) | all required fields that user send them  | 
| optional_fields | [WorkflowProcessField[]](../process/schema.md#workflowprocessfield-schema) | all optional fields that user send them  | 
| send_fields | [WorkflowProcessField[]](../process/schema.md#workflowprocessfield-schema) | all fields that before set  | 

> in `hook_url` type, if no response or error response receive, then failed action.

when you set state action as `hook_url` or `redis`, you must response to complete action:

### `string` response

you can send just next state as string

### `object` response

| name | type | required | Description |
| ----------- | ----------- |----------- |----------- |
| state_name | string | **YES** | the state that go on, if null, then failed state | 
|response_message | string | NO | message of responsible server|
|fields|object|NO|update some fields of process|


> after a timeout (defined in [server](../../configs/server.md) configs), if no receive any response, failed action.