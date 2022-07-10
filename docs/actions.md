# action shared properties

- name: string
- message_required?: boolean
- meta?: object
- an object for declare more properties for action (most used in front)
- access_roles?: string[] 
- optional_fields?: string[]
- required_fields?: string[]
- set_fields?: object

# action methods

## hook_url

* parameters
1. url: string
2. method: 'get' | 'post' | 'delete' | 'put'
* send parameters:
1. required_fields?: string[]
2. optional_fields?: string[]
3. state_name: string
4. flow_name: string
5. process_hash: string
6. state_action: string 
7. user_id: number
8. message?: string
* return response: [object | string]
1. state_name: string 
- the state that go on, if null, then failed state
- just can send state_name as string
2.  message?: string
- saved as hook_message in db
3. fields?: object
- update many fields of process

## redis

* parameters: 
1. channel: string
2. instance?: string
- if not set, use default instance of redis in config
3. response_channel: string
- just can publish state name
- can publish json stringify with {state_name: 'sample', message: 'hello...', 'fields': {'is_done': false},}
* send parameters:
on top
* return response: [object | string]
on top


## local

* parameters:
1. next_state?: string
- if empty, no change state, just update fields if exist