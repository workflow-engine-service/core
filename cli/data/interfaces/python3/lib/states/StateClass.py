
from typing import Dict, List

from ActionClass import WorkflowStateAction
from EventClass import WorkflowStateEvent


class WorkflowState():
    name: str
    meta: Dict
    access_roles: List[str] = ['_all_']
    actions: List[WorkflowStateAction]
    events: List[WorkflowStateEvent]

    def getActionByName(self, name: str) -> WorkflowStateAction:
        for act in self.actions:
            if act.__name == name:
                return act
        return None
