
import setup
from fields import {{name}}Fields
from lib.workflow import workflow
from states import {{name}}States


class {{name}}WorkFlow(workflow.Workflow):
    NAME = '{{name}}'
    ENTER_STATE = 'enter_state'
    FINISH_STATE = 'finish'
    FIELDS = {{name}}Fields()
    STATES = {{name}}States
