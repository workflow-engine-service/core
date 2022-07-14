

from enum import Enum
from typing import Dict, List


class FieldItemValidationBuiltInCheckType(Enum):
    # FILE_TYPE = 'file_type'
    # FILE_SIZE = 'file_size'
    EMAIL = 'email'


class FieldItemValidation():
    __builtin_check: FieldItemValidationBuiltInCheckType
    __builtin_params: Dict
    __error: str
    builtInType = FieldItemValidationBuiltInCheckType
    __regex: str
    __regexFlags: str

    def __init__(self, builtin_check: FieldItemValidationBuiltInCheckType, builtin_params: Dict = {}, error=None, regex: str = None, regexFlags: str = None):
        self.__builtin_check = builtin_check
        self.__builtin_params = builtin_params
        self.__error = error


class FieldItem():
    _description = 'A Short Description about field type'
    __meta: Dict = {}
    __name: str
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


class StringField(FieldItem):
    _description = 'String field contains chars, numbers and any other chars'

    def autoDefaultValue(self):
        return ''


class NumberField(FieldItem):
    _description = 'Number field contrains just numbers'

    def autoDefaultValue(self):
        return 0


class FileField(FieldItem):
    _description = 'File Field contains a file object'
    __max_file_size: int
    __allowed_mime_types: List[str]

    def __init__(self, *args, max_file_size: int, allowed_mime_types: List[str]):
        super().__init__(*args)
        self.__max_file_size = max_file_size
        self.__allowed_mime_types = allowed_mime_types


class BooleanField(FieldItem):
    _description = 'Boolean Field contains just true or false'

    def autoDefaultValue(self):
        return False


class DateTimeField(FieldItem):
    _description = 'Date Time Field get date and time'
