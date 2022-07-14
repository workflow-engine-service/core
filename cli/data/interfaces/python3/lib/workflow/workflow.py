

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


class Workflow():
    NAME: str = None
    VERSION = 1
    ENTER_STATE: str = None
    FINISH_STATE: str = None
    FIELDS: FieldClass = None
    CREATE_ACCESS_ROLES: List[str] = ['_all_']
    PROCESS_INIT_CHECK: WorkflowProcessInitCheck = None
    AUTO_DELETE_AFTER_END = FALSE
    STATES = []
    _stateInstances = []

    def __init__(self) -> None:
        pass

    def startState(self):
        return self.ENTER_STATE

    def endState(self):
        return self.FINISH_STATE

    def goToState(state: str):
        # TODO:
        pass

    def deploy():
        # TODO:
        pass

    def __str__(self) -> str:
        return json.dumps({
            'workflow_name': self.NAME,
            'version': self.VERSION,
            'create_access_roles': self.CREATE_ACCESS_ROLES
        })
