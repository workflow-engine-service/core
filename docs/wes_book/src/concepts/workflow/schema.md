# Schema details

## main schema (20220727 edition)

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
|api_url|string|NO|api url can only response boolean or a error string like 'you can not create new process'

## WorkflowField schema

| name | type | required | Description |
| ----------- | ----------- |----------- |----------- |
| name | string | **YES** | field name | 
|type | string | NO | 'string' or 'number' or 'boolean' or 'file' (default: string)|
|meta|object|NO|any data useful for client
|validation|WorkflowFieldValidation[]|NO|you can set more validations on field

## WorkflowState schema

| name | type | required | Description |
| ----------- | ----------- |----------- |----------- |
| name | string | **YES** | state name | 
|access_role | string[] | NO | roles to view this state (default: `['_all_']`)|
|meta|object|NO|any data useful for client|
|actions|WorkflowStateAction[]|NO|actions of state|
|events|WorkflowStateEvent[]|NO|you can define events on state|
