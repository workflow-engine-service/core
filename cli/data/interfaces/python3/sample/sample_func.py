
from {{name}} import {{name}}WorkFlow

print('[+] init workflow class')
{{name}}_workflow = {{name}}WorkFlow()
# get json string of workflow
# print({{name}}_workFlow)
# deploy workflow
print('[+] deploy workflow schema')
print({{name}}_workflow.deploy())
# create new process
print('[+] create workflow process')
newProcess = {{name}}_workflow.create()
print(newProcess[0])
print('[+] get current state of process')
# get current state info
print(newProcess[0].currentState())
