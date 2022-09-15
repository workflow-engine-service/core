# TODO Tasks

[ ] validate fields on execute action
[ ] check for end state
[ ] enable multi threading for workers
[ ] complete to validate deployed workflow
[ ] run state jobs as workers
[ ] manage uploaded files
[ ] apply priority of workers
[ ] auto start processes


# Testing Tasks
[ ] not create new worker for an action when exist and running
[ ] add headers to event requests
[ ] return process history

# DONE Tasks
[x] init workflow core
[x] init swagger
[x] do action with redis
[x] do action with local
[x] call 'onInit' event of state
[x] emit action event on redis
[x] call 'onLeave' event of state
[x] update field values after success action
[x] add process history after success action
[x] add `read_access_roles` to workflow
[x] emit action event on hook
[x] do action with hook
[x] create mdbook docs
[x] add alias_name to state action type hook_url
[x] add alias_name to state action type redis
[x] add alias_name to state event type hook_url
[x] add alias_name to state event type redis
[x] add license and code of conduct
[x] add `send_fields` to state action
[x] send required, optional fields to action hook or redis
[x] connect frontend app to workflow
[x] get workflows list api
[x] add api for users list
[x] add api for get workflow schema
[x] add pagination to apis
[x] get user info by api
[x] start api testing
[x] implement authenticate methods
[x] support state jobs
[x] add jobs on states
[x] add _owner_ role
[x] add `owner_id` to action request
[x] add base_url to hook types (action, event)
[x] get filtered process list
[x] return process fields
