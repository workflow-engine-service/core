# Schema details (20220814.1 edition)

## main schema

| name | type | required | Description |
| ----------- | ----------- |----------- |----------- |
| workflow_name | string | **YES** | name of workflow | 
| version | number | NO | default is 1 |
|create_access_roles | string[] | NO | user roles that access to create process from this workflow (default: `['_all_']`)
|read_access_roles | string[] | NO | user roles that access to read process from this workflow (default: `['_all_']`)
|process_init_check| [WorkflowProcessOnInit](#workflowprocessoninit-schema) | NO | check when a process wants to start
|auto_delete_after_end| boolean | NO | delete process after enter to end state
|start_state| string | **YES** | start state of process
|end_state| string | **YES** | end state of process
|fields| [WorkflowField](#workflowfield-schema) | NO | workflow fields
|states| [WorkflowState](#workflowstate-schema) | **YES** | workflow states

## WorkflowProcessOnInit schema

| name | type | required | Description |
| ----------- | ----------- |----------- |----------- |
| type | string | **YES** | can be `local` or `api` | 
|local_check | string | NO | check in local mode by workflow engine. options: ``` just_one_user_running_process: every user can only create one running process```|
|api_url|string|NO|api url can only response boolean or a error string like 'you can not create new process'|

## WorkflowField schema

| name | type | required | Description |
| ----------- | ----------- |----------- |----------- |
| name | string | **YES** | field name | 
|type | string | NO | 'string' or 'number' or 'boolean' or 'file' (default: string)|
|meta|object|NO|any data useful for client
|validation|WorkflowFieldValidation[]|NO|you can set more validations on field|

## WorkflowState schema

| name | type | required | Description |
| ----------- | ----------- |----------- |----------- |
| name | string | **YES** | state name | 
|access_role | string[] | NO | roles to view this state (default: `['_all_']`)|
|meta|object|NO|any data useful for client|
|actions|[WorkflowStateAction](#workflowstateaction-schema)[]|NO|actions of state|
|events|[WorkflowStateEvent](#workflowstateevent-schema)[]|NO|you can define events on state|
|jobs|[WorkflowStateJob](#workflowstatejob-schema)[] [^state_job_note]|NO|you can define jobs on state|

## WorkflowStateAction schema

> for more information about state actions, continue from [here](../state_action/state_action.md)

| name | type | required | Description |
| ----------- | ----------- |----------- |----------- |
| name | string | **YES** | action name | 
|access_role | string[] | NO | roles to execute this action (default: `['_all_']`)|
|required_fields| string[] | NO | fields must get from client|
|optional_fields| string[] | NO | fields that client can send|
|send_fields| string[] | NO | fields that must be send to app server [^send_fields_note]|
|type | string | NO | 'hook_url' or 'redis' or 'local' |
|alias_name| string | NO | name of an alias [^alias_name_note]|
|meta|object|NO|any data useful for client|
message_required | boolean | NO | client must send a message or not | 
|set_fields | object | NO | fields that can set hardcoded|
|base_url| string | NO | base url for relative url like `http://sample.com` [^hook_base_url_note] |
|url| string | NO | can be a url like `http://sample.com/hook` or `/hook`. used for 'hook_url' type|
|method| string | NO | can be a request method like 'get' or 'post'. used for 'hook_url' type|
|headers| string[] | NO | headers that can be set on hook request. used for 'hook_url' type|
|channel|string|NO| publish channel name. used for 'redis' type|
|response_channel|string|NO| subscribe channel name. used for 'redis' type|
|redis_instance|string|NO| a redis instance name. used for 'redis' type. (default is first instance defined on configs)|
|next_state|string|NO| next state to be go. used for 'local' type|


## WorkflowStateEvent schema

| name | type | required | Description |
| ----------- | ----------- |----------- |----------- |
| name | 'onInit' or 'onLeave' or 'onJob' | **YES** | event name | 
|type | 'redis' or 'hook_url' | **YES** |  type of send event |
|alias_name| string | NO | name of an alias [^alias_name_note]|
|base_url| string | NO | base url for relative url like `http://sample.com` [^hook_base_url_note] |
|url| string | NO | can be a url like `http://sample.com/hook` or `/hook`. used for 'hook_url' type|
|method| string | NO | can be a request method like 'get' or 'post'. used for 'hook_url' type|
|headers| string[] | NO | headers that can be set on hook request. used for 'hook_url' type|
|channel|string|NO| publish channel name. used for 'redis' type|
|redis_instance|string|NO| a redis instance name. used for 'redis' type. (default is first instance defined on configs)|


## WorkflowStateJob schema 

| name | type | required | Description |
| ----------- | ----------- |----------- |----------- |
| type | string | **YES** | job type can be "static" or "daily" or "weekly" or "hourly" or "minutely" or "afterTime" | 
|times | [WorkflowStateJobTime](#workflowstatejobtime-schema)[] | **YES** | set times to execute job|
|set_fields | object | NO | fields that can set hardcoded|
|action_name|string|NO| action to be go. |


## WorkflowStateJobTime schema

| name | type | required | Description |
| ----------- | ----------- |----------- |----------- |
| timestamp | number | NO | just used for 'static' type |  
| day | number | NO | used for 'afterTime' type | 
| weekday | number | NO | used for 'weekly' and 'static' type (range 1..7) | 
| hour | number | NO | used for 'afterTime' and 'daily' and 'weekly' and 'static' type (range 1..24) | 
| minute | number | NO | used for 'afterTime' and 'hourly' and 'daily' and 'weekly'  and 'static' type | 
| second | number | NO | used for 'afterTime' and 'minutely' and 'hourly' and 'daily' and 'weekly' and 'static' type | 


-----------

[^alias_name_note] added in 20220727.1

[^send_fields_note] added in 20220727.2

[^state_job_note] added in 20220810.1

[^hook_base_url_note] added in 20220814.1