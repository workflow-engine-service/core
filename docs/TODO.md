# TODO Tasks

[ ] validate fields on execute action
[ ] check for end state
[ ] enable multi threading for workers
[ ] complete to validate deployed workflow
[ ] add jobs on states
[ ] run state jobs as workers
[ ] add _owner_ role
[ ] implement authenticate methods
[ ] connect frontend app to workflow

# Testing Tasks
[ ] not create new worker for an action when exist and running
[ ] add headers to event requests
[ ] add `owner_id` to action request

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
