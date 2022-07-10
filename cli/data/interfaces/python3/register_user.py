

from typing import Dict

from .lib.types import WorkflowStateType


class RegisterUserFlow():
    ENTER_STATE = 'enter_state'
    FINISH_STATE = 'finish'
    _states = [
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
    _stateInstances = []

    def __init__(self) -> None:
        for item in self._states:
            self._addState(item)

    def _addState(self, item: WorkflowStateType):
        instance = RegisterUserFlowState()
        instance.name = item.name
        instance.meta = item.meta
        instance.access_roles = item.access_roles
        self._states.append(instance)

    def startState():
        return RegisterUserFlow.ENTER_STATE

    def endState(): return RegisterUserFlow.FINISH_STATE

    _fields = [
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
    ]

    def goToState(state: str):
        # TODO:
        pass

    def deploy():
        # TODO:
        pass


class RegisterUserFlowState(WorkflowStateType):
    # append()

    # RegisterUserFlow._fields.
