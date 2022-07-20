
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

    def processAction(self, processId: str, state_action: str, message: str = None, fields: Dict = {}) -> Dict:
        data = {
            'process_id': processId,
            'state_action': state_action,
            'message': message,
        }
        # =>add fields
        for key, value in fields.items():
            data['field.' + key] = value

        response = self._callPOSTApi(
            '/workflow/action', data, {
                'Content-Type': 'multipart/form-data'
            })
        if response.code == 200:
            return response.body['data']
        return None
