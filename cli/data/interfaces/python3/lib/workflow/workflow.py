

import json
from lib.apis.admin_api import WorkflowAdminApi
from lib.apis.user_api import WorkflowUserApi
import setup
from pickle import FALSE
from typing import Dict, List, Literal

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
    _admin_apis: WorkflowAdminApi
    _user_apis: WorkflowUserApi
    _settings: any

    def __init__(self, settings) -> None:
        self._settings = settings
        # if settings.debug_mode:
        #     print('settings:', json.dumps(str(self._settings)))

        self._admin_apis = WorkflowAdminApi(
            settings.workflow_base_url, settings.admin_username, settings.admin_secret_key, settings.debug_mode)
        self._user_apis = WorkflowUserApi(
            settings.workflow_base_url, settings.admin_username, settings.admin_secret_key, settings.debug_mode)

    def startState(self):
        return self.START_STATE

    def endState(self):
        return self.END_STATE

    def goToState(state: str):
        # TODO:
        pass

    def deploy(self):
        return self._admin_apis.deployWorkflow(json.loads(str(self)))

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
