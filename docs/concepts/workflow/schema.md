# Schema details (20220906.1 edition)

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
|events|[WorkflowStateEvent](#workflowstateevent-schema)|NO|you can define events on state|
|jobs|[WorkflowStateJob](#workflowstatejob-schema)[]  [^3] |NO|you can define jobs on state|

## WorkflowStateAction schema

> for more information about state actions, continue from [here](../state_action/state_action.md)

| name | type | required | Description |
| ----------- | ----------- |----------- |----------- |
| name | string | **YES** | action name | 
|access_role | string[] | NO | roles to execute this action (default: `['_all_']`)|
|required_fields| string[] | NO | fields must get from client|
|optional_fields| string[] | NO | fields that client can send|
|send_fields| string[] | NO | fields that must be send to app server [^2]|
|type | string | NO | 'hook_url' or 'redis' or 'local' |
|alias_name| string | NO | name of an alias [^2]|
|meta|object|NO|any data useful for client|
message_required | boolean | NO | client must send a message or not | 
|set_fields | object | NO | fields that can set hardcoded|
|base_url| string | NO | base url for relative url like `http://sample.com` [^4] |
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
|alias_name| string | NO | name of an alias [^1]|
|base_url| string | NO | base url for relative url like `http://sample.com` [^4] |
|url| string | NO | can be a url like `http://sample.com/hook` or `/hook`. used for 'hook_url' type|
|method| string | NO | can be a request method like 'get' or 'post'. used for 'hook_url' type|
|headers| string[] | NO | headers that can be set on hook request. used for 'hook_url' type|
|channel|string|NO| publish channel name. used for 'redis' type|
|redis_instance|string|NO| a redis instance name. used for 'redis' type. (default is first instance defined on configs)|


## WorkflowStateJob schema 

| name | type | required | Description |
| ----------- | ----------- |----------- |----------- |
| repeat | number | NO | default is 0 that unlimited to repeat job | 
|times | [WorkflowStateJobTime](#workflowstatejobtime-schema) | **YES** | set times to execute job|
|set_fields | object | NO | fields that can set hardcoded|
|action_name|string|NO| action to will execute |
|state_name | string | NO | state to will go [^5]| 
|_id|string|NO|you can set an id or process automatically set it [^5]|


## WorkflowStateJobTime schema

| name | type | required | Description |
| ----------- | ----------- |----------- |----------- |
| timestamp | number or [WorkflowCalculator](#workflowcalculator-schema) [^6] | NO | - |  
| day | number or WorkflowCalculator [^6] | NO | day of month | 
| hour | number or WorkflowCalculator [^6] | NO | range 1..24 | 
| minute | number or WorkflowCalculator [^6] | NO | range 1..60 | 
| second | number or WorkflowCalculator [^6] | NO | range 1..60 | 

## WorkflowCalculator schema 

created in 20220906.1 [^6]. for more information, read [here](../calculator.md)


| name | type | required | Description |
| ----------- | ----------- |----------- |----------- |
| $field | string | NO | - |  
| $const | number or string or boolean | NO | a constant value like 3 or 'hello' | 
| $if | WorkflowCalculator  | NO | - | 
| $then | WorkflowCalculator  | NO | comes after `$if` |
| $else | WorkflowCalculator  | NO | comes after `$if` |
| $or | WorkflowCalculator[]  | NO |used in `$if` |
| $and | WorkflowCalculator[]  | NO |used in `$if` |
| $eq | WorkflowCalculator[2] | NO | (equals) used in `$if` |
| $gt | WorkflowCalculator[2] | NO | (greater than) used in `$if` |
| $lt | WorkflowCalculator[2] | NO | (less than) used in `$if` |
| $add | WorkflowCalculator[] | NO | add some number values |
| $minus | WorkflowCalculator[] | NO | minus some number values |
| $mul | WorkflowCalculator[] | NO | multiply some number values |





## Reference

[^1]: added in 20220727.1

[^2]: added in 20220727.2

[^3]: added in 20220810.1

[^4]: added in 20220814.1

[^5]: added in 20220821.1

[^6]: added in 20220906.1

