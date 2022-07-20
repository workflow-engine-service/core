
from typing import Dict, List, Tuple
from base_api import BaseApi


class WorkflowAdminApi(BaseApi):

    def workflows(self):
        # TODO:
        pass

    def deployWorkflow(self, code: Dict) -> Tuple[bool, str]:
        response = self._callPOSTApi('/admin/workflow/deploy', {'code': code})
        # print('response deploy:', response, code)
        if response.code == 200:
            return True, 'success'
        return False, response.body['data']

    def createWorkflowProcess(self, name: str, version: int) -> Tuple[bool, str]:
        response = self._callPOSTApi(
            '/workflow/create', {'name': name, 'version': version})
        # print('response deploy:', response)
        if response.code == 200:
            return True, response.body['data']
        return False, response.body['data']
