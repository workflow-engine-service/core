
import json
from typing import Dict, List

from ActionClass import WorkflowStateAction
from EventClass import WorkflowStateEvent


class WorkflowState():
    name: str
    meta: Dict = {}
    access_roles: List[str] = ['_all_']
    actions: List[WorkflowStateAction] = []
    events: List[WorkflowStateEvent] = []

    # def loadFromDict(self, obj: Dict):
    # self.name = obj['name']
    # if obj['access_roles'] is not None:
    #     self.access_roles = obj['access_roles']
    # if obj['meta'] is not None:
    #     self.meta = obj['meta']
    # self.actions = []
    # for action in obj['actions']:
    #     action = WorkflowStateAction()
    #     self.actions.append(action)
    #     # TODO:
    # self.

    def getActionByName(self, name: str) -> WorkflowStateAction:
        for act in self.actions:
            if act.get_name() == name:
                return act
        return None

    def __str__(self) -> str:
        schema = {
            'name': self.name,
            'meta': self.meta,
            'access_roles': self.access_roles,
            'actions': [],
            'events': [],
        }
        if self.actions:
            for action in self.actions:
                schema['actions'].append(json.loads(str(action)))
        if self.events:
            for event in self.events:
                schema['events'].append(json.loads(str(event)))
        return json.dumps(schema)
