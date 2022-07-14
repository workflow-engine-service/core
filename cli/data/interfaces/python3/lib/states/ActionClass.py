
from typing import Dict, List, Literal


class WorkflowStateAction():
    __name: str
    __type: Literal['hook_url', 'redis', 'local']
    __access_roles: List[str]
    __required_fields: List[str]
    __optional_fields: List[str]
    __message_required: bool
    __meta: Dict
    __set_fields: Dict
    # hook_url type
    __url: str
    __method: Literal['get', 'post', 'put', 'delete']
    # redis type
    __channel: str
    __response_channel: str
    # local type
    __next_state: str

    def __init__(self, name: str, access_roles: List[str] = ['_all_'], message_required=False, meta: Dict = {}):
        self.__name = name
        self.__access_roles = access_roles
        self.__message_required = message_required
        self.__meta = meta

        return None

    def hook_url(self, url: str, method: Literal['get', 'post', 'put', 'delete'] = 'post'):
        self.__type = 'hook_url'
        self.__url = url
        self.__method = method

    def redis(self, channel: str, response_channel: str, instance: str = ''):
        self.__type = 'redis'
        self.__channel = channel
        self.__response_channel = response_channel

    def local(self, next_state: str):
        self.__type = 'local'
        self.__next_state = next_state
