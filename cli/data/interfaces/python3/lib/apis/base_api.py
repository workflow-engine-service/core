

import json
from typing import Dict
from lib.workflow.request import callGETApi, callPOSTApi


class BaseApi():
    _baseUrl: str
    _apiBaseUrl = '/api/v1'
    _admin_username: str
    _admin_secret_key: str
    _token: str = None
    _refresh_token: str
    _debug_mode = False
    _expired_time_token: str
    _auth_header_name: str

    def __init__(self, baseUrl: str, admin_username: str, admin_secretkey: str, debug_mode=False, auth_header_name='Authorization') -> None:
        self._admin_username = admin_username
        self._admin_secret_key = admin_secretkey
        self._debug_mode = debug_mode
        self._auth_header_name = auth_header_name
        self._baseUrl = baseUrl
        if self._baseUrl.endswith('/'):
            self._baseUrl = self._baseUrl[:-1]
        # auth admin user
        # self.userToken()

    def _callPOSTApi(self, path: str, data: Dict, headers: Dict = {}):
        if self._token is None:
            self.userToken()
        # =>set auth token
        headers[self._auth_header_name] = self._token
        response = callPOSTApi(self.absApiUrl(
            path), data, debug_mode=self._debug_mode, headers=headers)
        # print('resp:', response.body)
        if type(response.body) is str:
            response.body = json.loads(response.body)

        return response

    def _callGETApi(self, path: str, params: Dict, headers: Dict = {}):
        if self._token is None:
            self.userToken()
        # =>set auth token
        headers[self._auth_header_name] = self._token
        response = callGETApi(self.absApiUrl(
            path), params, debug_mode=self._debug_mode, headers=headers)
        # print('res:', response.body)
        if type(response.body) is str:
            response.body = json.loads(response.body)

        return response

    def absApiUrl(self, path: str):
        return self._baseUrl + self._apiBaseUrl + path

    def userToken(self, username: str = None, secret_key: str = None):
        if username is None:
            username = self._admin_username
        if secret_key is None:
            secret_key = self._admin_secret_key
        response = callPOSTApi(self.absApiUrl('/token'), {
            'username': username,
            'secret_key': secret_key,
        }, debug_mode=self._debug_mode)
        # print(response, response['code'])
        # if success
        if response.code == 200:
            self._token = response.body['data']['access_token']
            self._refresh_token = response.body['data']['refresh_token']
            self._expired_time_token = response.body['data']['expired_time']
            # print(response)
