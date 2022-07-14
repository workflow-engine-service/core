
from typing import Literal


class WorkflowStateEvent():
    __name: Literal['onInit', 'onLeave']
    __type: Literal['redis', 'hook_url']
    # hook_url type
    __url: str
    __method: Literal['get', 'post', 'put', 'delete']
    # redis type
    __channel: str
    __response_channel: str

    def __init__(self, name: str):
        self.__name = name

        return self

    def hook_url(self, url: str, method: Literal['get', 'post', 'put', 'delete'] = 'post'):
        self.__type = 'hook_url'
        self.__url = url
        self.__method = method

    def redis(self, channel: str, response_channel: str, instance: str = ''):
        self.__type = 'redis'
        self.__channel = channel
        self.__response_channel = response_channel
