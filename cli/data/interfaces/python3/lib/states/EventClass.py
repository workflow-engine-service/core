
import json
from typing import Literal


class WorkflowStateEvent():
    __name: str
    __type: Literal['redis', 'hook_url']
    __alias_name: str = None
    # hook_url type
    __url: str
    __method: Literal['get', 'post', 'put', 'delete']
    # redis type
    __channel: str
    __redis_instance: str = None

    def __init__(self, name: Literal['onInit', 'onLeave']):
        self.__name = name

        return None

    def hook_url(self, url: str, method: Literal['get', 'post', 'put', 'delete'] = 'post', alias_name: str = None):
        self.__type = 'hook_url'
        self.__url = url
        self.__method = method
        self.__alias_name = alias_name
        return self

    def redis(self, channel: str, instance: str = None, alias_name: str = None):
        self.__type = 'redis'
        self.__channel = channel
        self.__alias_name = alias_name
        if instance is not None:
            self.__redis_instance = instance
        return self

    def __str__(self) -> str:
        schema = {
            'name': self.__name,
            'type': self.__type,
        }
        if self.__alias_name is not None:
            schema['alias_name'] = self.__alias_name
        if self.__type == 'hook_url':
            schema['url'] = self.__url
            schema['method'] = self.__method
        elif self.__type == 'redis':
            schema['channel'] = self.__channel
            if self.__redis_instance is not None:
                schema['redis_instance'] = self.__redis_instance

        return json.dumps(schema)
