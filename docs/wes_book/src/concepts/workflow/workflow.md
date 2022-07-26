# Workflow

a workflow just a json schema that once deployed on workflow engine and **NOT CHANGED** forever until reset mongo db.

so you can just deploy your workflow once. if you can upgrade your workflow schema, you can deploy workflow with different version

sample workflow schema:
```json
{
    "workflow_name": "register_user",
    "version": 1,
    "create_access_roles": [
        "_all_"
    ],
    "auto_delete_after_end": true,
    "start_state": "enter_info",
    "end_state": "finish",
    "fields": [
        {
            "name": "firstname"
        },
        {
            "name": "lastname",
            "type": "string",
            "meta": {
                "title": "نام خانوادگی",
                "help": "نام خود را وارد کنید",
                "class": "col-sm col"
            }
        },
        {
            "name": "phone",
            "type": "number"
        },
        {
            "name": "email",
            "validation": [
                {
                    "builtin_check": "email",
                    "error": "email not valid"
                }
            ]
        },
        {
            "name": "avatar",
            "type": "file",
            "validation": [
                {
                    "builtin_check": "file_type",
                    "builtin_params": {
                        "types": [
                            "image/png",
                            "image/jpg"
                        ]
                    },
                    "error": "avatar image not valid"
                },
                {
                    "builtin_check": "file_size",
                    "builtin_params": {
                        "max": 10000
                    },
                    "error": "avatar image size not valid"
                }
            ]
        }
    ],
    "states": [
        {
            "name": "enter_info",
            "meta": {
                "title": "ورود اطلاعات"
            },
            "access_roles": [
                "_all_"
            ],
            "actions": [
                {
                    "access_roles": [
                        "manager"
                    ],
                    "required_fields": [
                        "firstname",
                        "lastname",
                        "phone"
                    ],
                    "optional_fields": [
                        "email"
                    ],
                    "name": "approve",
                    "type": "hook_url",
                    "url": "http://127.0.0.1/django/api/v1/register",
                    "method": "post",
                    "message_required": "false",
                    "meta": {
                        "color": "green",
                        "title": "تایید اولیه"
                    }
                },
                {
                    "name": "reject",
                    "type": "redis",
                    "channel": "register",
                    "message_required": "true",
                    "response_channel": "resp_register",
                    "set_fields": {
                        "is_done": false
                    },
                    "meta": {
                        "color": "red",
                        "isCircleButton": true
                    }
                },
                {
                    "name": "edit",
                    "type": "local",
                    "next_state": "finish"
                }
            ]
        },
        {
            "name": "finish"
        }
    ]
}


```