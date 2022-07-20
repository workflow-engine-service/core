
from typing import Dict
from base_api import BaseApi
from lib.workflow.request import callPOSTApi


class WorkflowUserApi(BaseApi):
    def stateInfo(self, processId: str) -> Dict:
        response = self._callGETApi(
            '/workflow/state-info', {'process_id': processId})
        if response.code == 200:
            return response.body['data']
        return None
