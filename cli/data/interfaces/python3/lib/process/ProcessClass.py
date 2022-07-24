

from datetime import datetime
import json
from typing import Dict, List, Tuple, Union
from lib.process.WorkerClass import WorkerClass
from lib.states.ActionClass import WorkflowStateAction
from lib.workflow.WorkflowClass import WorkflowDefinition
from lib.apis.admin_api import WorkflowAdminApi
from lib.apis.user_api import WorkflowUserApi

from lib.states.StateClass import WorkflowState

# from lib.workflow.workflow import Workflow


class WorkflowProcess():
    _id: str
    workflow_name: str
    workflow_version: int
    current_state: str
    field_values: List
    history: List
    workflow: Dict
    created_at: datetime
    created_by: int
    updated_at: datetime
    _admin_api: WorkflowAdminApi
    _user_api: WorkflowUserApi
    _workflow: WorkflowDefinition

    def __init__(self, obj: Dict, workflow: WorkflowDefinition,  admin_api: WorkflowAdminApi, user_api: WorkflowUserApi) -> None:

        self._update_by_obj(obj)
        self._admin_api = admin_api
        self._user_api = user_api
        self._workflow = workflow

    def _update_by_obj(self, obj: Dict):
        self.workflow_name = obj['workflow_name']
        self.workflow_version = obj['workflow_version']
        self.current_state = obj['current_state']
        self.field_values = obj['field_values']
        self.history = obj['history']
        self.workflow = obj['workflow']
        self._id = obj['_id']
        self.created_at = datetime.fromtimestamp(int(obj['created_at']) / 1000)
        if obj.get('updated_at') is not None:
            self.updated_at = datetime.fromtimestamp(
                int(obj['updated_at']) / 1000)
        self.created_by = obj['created_by']

    def __str__(self) -> str:
        return json.dumps({
            'workflow_name': self.workflow_name,
            'workflow_version': self.workflow_version,
            'current_state': self.current_state,
            'field_values': self.field_values,
            # TODO:
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S')
        })

    def update(self):
        response = self._user_api.processInfo(
            self._id)
        self._update_by_obj(response)

        return self

    def currentState(self) -> WorkflowState:
        """get current state info
        """
        stateObj = self._user_api.stateInfo(self._id)
        if stateObj is None:
            return None
        # print('state:', stateObj)
        # =>find state by name
        for state in self._workflow.states:
            if state.name == stateObj['name']:
                return state

    def executeAction(self, action: WorkflowStateAction, message: str = None, fields: Dict = {}) -> Union[WorkerClass, str]:
        response = self._user_api.processAction(
            self._id, action.get_name(), message, fields)
        if response[0] is None or type(response[0]) is not str:
            return response[1]
        return WorkerClass(response[0], self._user_api)

    def executeActionByName(self, action_name: str, message: str = None, fields: Dict = {}):
        # =>find current state
        for state in self._workflow.states:
            # =>find action by name
            for action in state.actions:
                if action.get_name() == action_name:
                    return self.executeAction(action, message, fields)
        return None
