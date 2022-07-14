from typing import List

from lib.states.ActionClass import WorkflowStateAction
from lib.states.StateClass import WorkflowState


class enter_info_state(WorkflowState):
    name = 'enter_info'
    actions = [
        WorkflowStateAction('approve').redis('app_channel', 'app_channel_resp')
    ]


{{name}}States: List[WorkflowState] = [
    enter_info_state()
]
