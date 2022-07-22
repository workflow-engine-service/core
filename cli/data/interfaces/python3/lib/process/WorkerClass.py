

from datetime import datetime
import json
from typing import Dict, Literal

from lib.apis.user_api import WorkflowUserApi


class WorkerClass():
    __id: str
    __priority: int = 1
    __init_at: datetime = None
    __started_at: datetime = None
    __ended_at: datetime = None
    __response: Dict = None
    __type: Literal['state_action'] = None
    __user_api: WorkflowUserApi
    __success: bool = None
    __datetimeFields = ['init_at', 'started_at', 'ended_at']

    def __init__(self, id: str, user_api: WorkflowUserApi) -> None:
        self.__id = id
        self.__user_api = user_api

    def info(self):
        response = self.__user_api.workerInfo(self.__id)
        if response is None:
            return None
        # print(response, type(response['init_at']))
        self.__type = response['type']
        self.__priority = response['priority']
        for field in self.__datetimeFields:
            if response.get(field) is not None and type(response[field]) == int:
                setattr(self, self.__get_attr(field), datetime.fromtimestamp(
                    int(response[field]) / 1000))
        if response.get('response') is not None:
            self.__response = response.get('response')
        if response.get('success') is not None:
            self.__success = response.get('success')
        return self

    def id(self):
        return self.__id

    def priority(self):
        return self.__priority

    def started_at(self):
        return self.__started_at

    def ended_at(self):
        return self.__ended_at

    def response(self):
        return self.__response

    def is_success(self):
        return self.__success

    def is_pending(self):
        return self.__success is None

    def init_at(self):
        return self.__init_at

    def __get_attr(self, name):
        return '_{}__{}'.format('WorkerClass', name)

    def __str__(self) -> str:
        data = {
            'id': self.__id,
            'priority': self.__priority,
        }
        if self.__type is not None:
            data['type'] = self.__type
        if self.__success is not None:
            data['success'] = self.__success
        if self.__response is not None:
            data['response'] = self.__response
        for field in self.__datetimeFields:
            if getattr(self, self.__get_attr(field)) is not None:
                data[field] = getattr(self, self.__get_attr(field)).strftime(
                    '%Y-%m-%d %H:%M:%S')
        return json.dumps(data)
