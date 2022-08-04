
from . import setup
from fields import {{name}}Fields
from lib.workflow import workflow
from states import {{name}}States

import settings


class {{name}}WorkFlow(workflow.Workflow):
    NAME = '{{name}}'
    VERSION = {{version}}
    START_STATE = 'enter_info'
    END_STATE = 'finish'
    FIELDS = {{name}}Fields()
    STATES = {{name}}States

    def __init__(self) -> None:
        super().__init__(settings)
