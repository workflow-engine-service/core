from typing import List

from lib.states.EventClass import WorkflowStateEvent
from lib.states.ActionClass import WorkflowStateAction
from lib.states.StateClass import WorkflowState


class enter_info_state(WorkflowState):
    name = 'enter_info'
    actions = [
        WorkflowStateAction('approve').hook_url(
            'http://localhost:5000/api/hook', 'post', {'app_name': 'register_user_workflow'}).required_fields(['email'])
    ]


class process_data_state(WorkflowState):
    name = 'process_data'
    actions = [
        WorkflowStateAction('approve').hook_url(
            'http://localhost:5000/api/hook', 'post', {'app_name': 'register_user_workflow'}).send_fields(['email', 'phone'])
    ]


class finish_state(WorkflowState):
    name = 'finish'
    events = [
        WorkflowStateEvent('onInit').hook_url(
            'http://localhost:5000/api/event', 'put')
    ]


States: List[WorkflowState] = [
    enter_info_state(),
    process_data_state(),
    finish_state()
]
