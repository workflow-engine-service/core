import json
from typing import Dict, Literal
import urllib.parse
import urllib.request
import requests

from lib.utils.Dict2Class import Dict2Class
from lib.utils.multipart_sender import MultiPartForm

user_agent = 'Mozilla/5.0 (Windows NT 6.1; Win64; x64)'
responses = {
    100: ('Continue', 'Request received, please continue'),
    101: ('Switching Protocols',
          'Switching to new protocol; obey Upgrade header'),

    200: ('OK', 'Request fulfilled, document follows'),
    201: ('Created', 'Document created, URL follows'),
    202: ('Accepted',
          'Request accepted, processing continues off-line'),
    203: ('Non-Authoritative Information', 'Request fulfilled from cache'),
    204: ('No Content', 'Request fulfilled, nothing follows'),
    205: ('Reset Content', 'Clear input form for further input.'),
    206: ('Partial Content', 'Partial content follows.'),

    300: ('Multiple Choices',
          'Object has several resources -- see URI list'),
    301: ('Moved Permanently', 'Object moved permanently -- see URI list'),
    302: ('Found', 'Object moved temporarily -- see URI list'),
    303: ('See Other', 'Object moved -- see Method and URL list'),
    304: ('Not Modified',
          'Document has not changed since given time'),
    305: ('Use Proxy',
          'You must use proxy specified in Location to access this '
          'resource.'),
    307: ('Temporary Redirect',
          'Object moved temporarily -- see URI list'),

    400: ('Bad Request',
          'Bad request syntax or unsupported method'),
    401: ('Unauthorized',
          'No permission -- see authorization schemes'),
    402: ('Payment Required',
          'No payment -- see charging schemes'),
    403: ('Forbidden',
          'Request forbidden -- authorization will not help'),
    404: ('Not Found', 'Nothing matches the given URI'),
    405: ('Method Not Allowed',
          'Specified method is invalid for this server.'),
    406: ('Not Acceptable', 'URI not available in preferred format.'),
    407: ('Proxy Authentication Required', 'You must authenticate with '
          'this proxy before proceeding.'),
    408: ('Request Timeout', 'Request timed out; try again later.'),
    409: ('Conflict', 'Request conflict.'),
    410: ('Gone',
          'URI no longer exists and has been permanently removed.'),
    411: ('Length Required', 'Client must specify Content-Length.'),
    412: ('Precondition Failed', 'Precondition in headers is false.'),
    413: ('Request Entity Too Large', 'Entity is too large.'),
    414: ('Request-URI Too Long', 'URI is too long.'),
    415: ('Unsupported Media Type', 'Entity body in unsupported format.'),
    416: ('Requested Range Not Satisfiable',
          'Cannot satisfy request range.'),
    417: ('Expectation Failed',
          'Expect condition could not be satisfied.'),

    500: ('Internal Server Error', 'Server got itself in trouble'),
    501: ('Not Implemented',
          'Server does not support this operation'),
    502: ('Bad Gateway', 'Invalid responses from another server/proxy.'),
    503: ('Service Unavailable',
          'The server cannot process the request due to a high load'),
    504: ('Gateway Timeout',
          'The gateway server did not receive a timely response'),
    505: ('HTTP Version Not Supported', 'Cannot fulfill request.'),
}


def callPOSTApi(url: str, values: Dict = {}, headers: Dict = {}, debug_mode=False):
    response = _callApi(url, values, method='POST',
                        headers=headers, debug_mode=debug_mode)
    return response


def callGETApi(url: str, values: Dict = {}, headers: Dict = {}, debug_mode=False):
    response = _callApi(url, values, method='GET',
                        headers=headers, debug_mode=debug_mode)
    return response


def _callApi(url: str, values: Dict = {}, method: Literal['POST', 'GET', 'PUT', 'DELETE'] = 'POST', headers: Dict = {}, debug_mode=False):
    headers['User-Agent'] = user_agent
    if headers.get('accept') is None:
        headers['accept'] = 'application/json'
    if headers.get('Content-Type') is None:
        headers['Content-Type'] = 'application/json'

    data: bytes = None
    if method == 'GET' or method == 'DELETE':
        query_string = urllib.parse.urlencode(values)
        url = url + "?" + query_string
    else:
        # data = urllib.parse.urlencode(values)
        if headers['Content-Type'] == 'application/json':
            data = json.dumps(values)
            # headers['Content-Length'] = len(data)
        # elif headers['Content-Type'] == 'multipart/form-data':

        #     # myfile = open('path/to/file', 'rb')
        #     form = MultiPartForm()
        #     for k, v in values.items():
        #         form.add_field(k, v)
        #     form.make_result()
        #     # print(values, form.form_data)

        #     # url = 'http://myurl'
        #     # req1 = urllib.request.Request(url)
        #     headers['Content-type'] = form.get_content_type()
        #     headers['Content-length'] = len(form.form_data)
            # req1.add_data(form.form_data)

            # data = form.form_data
        # data = data.encode('utf-8')  # data should be bytes
    if debug_mode:
        print('request: [{}] {}'.format(method, url))
        # print('headers:', headers)
    # print('request data:', data)
    try:
        response: requests.Response
        if method == 'POST':
            response = requests.post(url, data, headers=headers)
        elif method == 'GET':
            response = requests.get(url, headers=headers)
        # TODO:
        # req = urllib.request.Request(
        #     url, data, headers=headers, method=method)
        # with urllib.request.urlopen(req, timeout=30) as response:
        response_text = response.text  # response.read().decode("utf-8")
        if headers['accept'] == 'application/json':
            response_text = json.loads(response_text)
        # print('res:', response)
        # print(response.read())
        return Dict2Class({
            'body': response_text,
            'code': response.status_code,
            'raw': json.dumps(str(response))
        })
    except Exception as e:
        # print(e)
        return Dict2Class({
            'code': 404,  # e.code,
            'body': '',  # e.read().decode(),
            'raw': json.dumps(str(e)),
            'error': True
        })
