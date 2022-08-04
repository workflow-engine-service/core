# Schema details (20220727.2 edition)

## main schema

| name | type | required | Description |
| ----------- | ----------- |----------- |----------- |
| _id | string | **YES** | id of process | 
| workflow_name |string | NO | workflow name |
| workflow_version | number | NO | default is 1 |
|current_state | string | **YES** | current state of process |
|field_values | [WorkflowProcessField[]](#workflowprocessfield-schema) | NO | process fields that filled|
|history| WorkflowProcessHistoryModel[] | **YES** | all history of process change states
|workflow| DeployedWorkflowModel | **YES** | workflow reference |
|created_at| number | **YES** | create process at date (timestamp)
|created_by| number | **YES** | who create process
|updated_at| number | **YES** | update process at date (timestamp)

## WorkflowProcessField schema

| name | type | required | Description |
| ----------- | ----------- |----------- |----------- |
| name | string | **YES** | name of field | 
|value | any | **YES** | value of field|
|meta|object|NO|meta data of field|
