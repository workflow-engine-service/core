from typing import List

from lib.states.EventClass import WorkflowStateEvent
from lib.states.ActionClass import WorkflowStateAction
from lib.states.StateClass import WorkflowState


class enter_info_state(WorkflowState):
    name = 'enter_info'
    actions = [
        WorkflowStateAction('approve').redis(
            'app_channel', 'app_channel_resp').required_fields(['email'])
    ]


class process_data_state(WorkflowState):
    name = 'process_data'
    actions = [
        WorkflowStateAction('approve').redis('app_channel', 'app_channel_resp')
    ]


class finish_state(WorkflowState):
    name = 'finish'
    events = [
        WorkflowStateEvent('onInit').redis('event_channel')
    ]


{{name}}States: List[WorkflowState] = [
    enter_info_state(),
    process_data_state(),
    finish_state()
]
