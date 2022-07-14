

import json
import setup
from pickle import FALSE
from typing import List, Literal
from ..states.StateClass import WorkflowState

from ..fields.FieldClass import FieldClass


class WorkflowProcessInitCheck():
    _type: str
    _local_check: str
    _api_url: str

    def __init__(self) -> None:
        return self

    def local(self, check: Literal['just_one_user_running_process']):
        self._type = 'local'
        self._local_check = check

    def api(self, url: str):
        self._type = 'api'
        self.url = url

    def __str__(self) -> str:
        return json.dumps({
            'type': self._type,
            'local_check': self._local_check,
            'api_url': self._api_url,
        })


class Workflow():
    NAME: str = None
    VERSION = 1
    START_STATE: str = None
    END_STATE: str = None
    FIELDS: FieldClass = None
    CREATE_ACCESS_ROLES: List[str] = ['_all_']
    PROCESS_INIT_CHECK: WorkflowProcessInitCheck = None
    AUTO_DELETE_AFTER_END = FALSE
    STATES = []
    _stateInstances = []

    def __init__(self) -> None:
        pass

    def startState(self):
        return self.START_STATE

    def endState(self):
        return self.END_STATE

    def goToState(state: str):
        # TODO:
        pass

    def deploy():
        # TODO:
        pass

    def __str__(self) -> str:
        schema = {
            'workflow_name': self.NAME,
            'version': self.VERSION,
            'create_access_roles': self.CREATE_ACCESS_ROLES,
            'start_state': self.START_STATE,
            'end_state': self.END_STATE,
            'fields': [],
            'states': [],
        }
        if self.AUTO_DELETE_AFTER_END:
            schema['auto_delete_after_end'] = True

        if self.PROCESS_INIT_CHECK:
            schema['process_init_check'] = self.PROCESS_INIT_CHECK
        if self.FIELDS:
            schema['fields'] = json.loads(str(self.FIELDS))
        if self.STATES:
            for state in self.STATES:
                schema['states'].append(json.loads(str(state)))

        return json.dumps(schema, sort_keys=True, indent=4)
