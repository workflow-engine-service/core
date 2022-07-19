
from typing import Dict
from base_api import BaseApi


class WorkflowAdminApi(BaseApi):

    def workflows(self):
        # TODO:
        pass

    def deployWorkflow(self, code: Dict):
        response = self._callPOSTApi('/admin/workflow/deploy', {'code': code})
        print('response deploy:', response, code)
