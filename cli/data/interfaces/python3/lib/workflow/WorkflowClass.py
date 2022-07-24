

from typing import Dict, List
from WorkflowProcessInitCheck import WorkflowProcessInitCheck
from lib.states.StateClass import WorkflowState
from lib.fields import FieldClass


class WorkflowDefinition():
    workflow_name: str
    version: int
    create_access_roles: List[str]
    read_access_roles: List[str]
    workflow_class_name: str
    process_init_check: WorkflowProcessInitCheck
    shared_actions: List[str]
    auto_delete_after_end: bool = False
    # auto_start?: {
    #     event: 'user_add' | 'user_emove' | 'user_update'
    #     // TODO:}
    start_state: str
    end_state: str
    fields: FieldClass
    states: List[WorkflowState]

    def __init__(self, name: str, version: int, start_state: str, end_state: str, fields: FieldClass, states: List[WorkflowState], create_access_roles: List[str] = ['_all_'], read_access_roles: List[str] = ['_all_'], process_init_check: WorkflowProcessInitCheck = None, auto_delete_after_end=False, ) -> None:
        self.workflow_name = name
        self.version = version
        self.create_access_roles = create_access_roles
        self.read_access_roles = read_access_roles
        self.process_init_check = process_init_check
        self.auto_delete_after_end = auto_delete_after_end
        self.start_state = start_state
        self.end_state = end_state
        self.fields = fields
        self.states = states
