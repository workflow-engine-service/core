
from typing import Dict, List, Literal


class WorkflowStateActionType():
    name: str
    type: Literal['hook_url', 'redis', 'local']
    access_roles: List[str]
    required_fields: List[str]
    optional_fields: List[str]
    message_required: bool
    meta: Dict
    set_fields: Dict
    # hook_url type
    url: str
    method: Literal['get', 'post', 'put', 'delete']
    # redis type
    channel: str
    response_channel: str
    # local type
    next_state: str
# ---------------------------


class WorkflowStateType():
    name: str
    meta: Dict
    access_roles: List[str]
    actions: List[WorkflowStateActionType]

    def getActionByName(self, name: str) -> WorkflowStateActionType:
        for act in self.actions:
            if act.name == name:
                return act
        return None
