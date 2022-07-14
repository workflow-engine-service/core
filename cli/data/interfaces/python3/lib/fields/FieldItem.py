

from enum import Enum
import json
from typing import Dict, List, Literal


class FieldItemValidationBuiltInCheckType(Enum):
    # FILE_TYPE = 'file_type'
    # FILE_SIZE = 'file_size'
    EMAIL = 'email'

    def __str__(self) -> str:
        return ''


class FieldItemValidation():
    __builtin_check: str
    __builtin_params: Dict
    __error: str = None
    # builtInType = FieldItemValidationBuiltInCheckType
    __regex: str = None
    __regexFlags: str = None

    def __init__(self, builtin_check: Literal['email'], builtin_params: Dict = {}, error=None, regex: str = None, regexFlags: str = None):
        self.__builtin_check = builtin_check
        self.__builtin_params = builtin_params
        self.__error = error
        self.__regex = regex
        self.__regexFlags = regexFlags

    def __str__(self) -> str:
        schema = {
            'builtin_check': self.__builtin_check,
            'builtin_params': self.__builtin_params,
            'error': self.__error,
            'regex': self.__regex,
            'regex_flags': self.__regexFlags,
        }
        return json.dumps(schema)


class FieldItem():
    _description = 'A Short Description about field type'
    _type: Literal['file', 'string', 'number', 'datetime', 'boolean']
    __meta: Dict = {}
    __name: str = None
    __validations: List[FieldItemValidation] = []
    __default: any

    def __init__(self, name=None, meta: Dict = {}, default=None) -> None:
        self.__meta = meta
        self.__name = name
        self.__default = default
        if self.__default is None:
            self.autoDefaultValue()
        return None

    def autoDefaultValue(self):
        self.__default = None

    def meta(self, key: str, default):
        return self.__meta.get(key, default)

    def validation(self, _validation: FieldItemValidation):
        self.__validations.append(_validation)
        return self

    def description(self):
        return self._description

    def setName(self, name: str):
        self.__name = name

    def hasName(self):
        return self.__name is not None

    def __str__(self) -> str:
        schema = {
            'name': self.__name,
            'meta': self.__meta,
            'type': self._type,
            'validation': []
        }
        if self.__validations:
            for val in self.__validations:
                schema['validation'].append(json.loads(str(val)))

        return json.dumps(schema)


class StringField(FieldItem):
    _description = 'String field contains chars, numbers and any other chars'
    _type = 'string'

    def autoDefaultValue(self):
        return ''


class NumberField(FieldItem):
    _description = 'Number field contrains just numbers'
    _type = 'number'

    def autoDefaultValue(self):
        return 0


class FileField(FieldItem):
    _description = 'File Field contains a file object'
    _type = 'file'
    __max_file_size: int
    __allowed_mime_types: List[str]

    def __init__(self, *args, max_file_size: int, allowed_mime_types: List[str]):
        super().__init__(*args)
        self.__max_file_size = max_file_size
        self.__allowed_mime_types = allowed_mime_types


class BooleanField(FieldItem):
    _description = 'Boolean Field contains just true or false'
    _type = 'boolean'

    def autoDefaultValue(self):
        return False


class DateTimeField(FieldItem):
    _description = 'Date Time Field get date and time'
    _type = 'datetime'
