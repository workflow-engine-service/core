

import json
from WorkflowProcessInitCheck import WorkflowProcessInitCheck
from lib.workflow.WorkflowClass import WorkflowDefinition
from lib.process.ProcessClass import WorkflowProcess
from lib.apis.admin_api import WorkflowAdminApi
from lib.apis.user_api import WorkflowUserApi
# from . import setup
from pickle import FALSE
from typing import Dict, List, Literal, Tuple

from ..fields.FieldClass import FieldClass


class Workflow():
    NAME: str = None
    VERSION = 1
    START_STATE: str = None
    END_STATE: str = None
    FIELDS: FieldClass = None
    CREATE_ACCESS_ROLES: List[str] = ['_all_']
    READ_ACCESS_ROLES: List[str] = ['_all_']
    PROCESS_INIT_CHECK: WorkflowProcessInitCheck = None
    AUTO_DELETE_AFTER_END = FALSE
    STATES = []
    _stateInstances = []
    _admin_apis: WorkflowAdminApi
    _user_apis: WorkflowUserApi
    _settings: any
    _workflow_define: WorkflowDefinition

    def __init__(self, settings) -> None:
        self._settings = settings
        # if settings.debug_mode:
        #     print('settings:', json.dumps(str(self._settings)))

        self._admin_apis = WorkflowAdminApi(
            settings.workflow_base_url, settings.admin_username, settings.admin_secret_key, settings.debug_mode)
        self._user_apis = WorkflowUserApi(
            settings.workflow_base_url, settings.admin_username, settings.admin_secret_key, settings.debug_mode)
        # =>init workflow define
        self._workflow_define = WorkflowDefinition(self.NAME, self.VERSION, self.START_STATE, self.END_STATE,
                                                   self.FIELDS, self.STATES, self.CREATE_ACCESS_ROLES, self.PROCESS_INIT_CHECK, self.AUTO_DELETE_AFTER_END)

    def startState(self):
        return self.START_STATE

    def endState(self):
        return self.END_STATE

    def create(self) -> Tuple[WorkflowProcess, str]:
        """
        create new process from this workflow
        """
        response = self._admin_apis.createWorkflowProcess(
            self.NAME, self.VERSION)
        if response[0] == True:
            return WorkflowProcess(response[1], self._workflow_define, self._admin_apis, self._user_apis), 'success'
        return None, response[1]

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
            'read_access_roles': self.READ_ACCESS_ROLES,
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
