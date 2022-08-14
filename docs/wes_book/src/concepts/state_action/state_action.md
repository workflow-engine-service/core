# State Action

every state of workflow, has some actions or not! you can see details of state action schema on [here](../workflow/schema.md#workflowstateaction-schema)

every action can be one of these types for execute:

> you can use, `alias` for `hook_url`, `redis` types by `alias_name` property.

#### hook_url

when your server must be determine that next state is which or you can manage action execute by your self app server.

you can use `base_url` property and set your relative path in `url` property. (also you can set `base_url` with `alias`)

for this you need to set a endpoint url as `url`, and your accept request method like `get` or `post` (default is `post` method)

and you can set custom headers on hook request that raised by workflow engine like a authenticate token:
```json
"headers": {
    "auth_token": "workflow_engine_token"
}
```


#### redis

when you communicate with workflow engine by **redis**, you can use this way.

you must to set a channel name that subscribe on it in your app server.
and set a response channel name that publish on it your response (like next state) in your app server.

in default, workflow service use first redis instance that defined in configs, but you can use specify redis instance by `redis_instance` parameter.

> `channel` and `response_channel` not be same!

#### local

if your action, can be execute locally, you can do this. you can just set your `next_state` name.

for example for reject actions, you can do this way.


