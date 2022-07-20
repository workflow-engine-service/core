
import json
from typing import Literal


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
