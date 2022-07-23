import time
from {{name}} import {{name}}WorkFlow

print('[+] init workflow class')
{{name}}_workflow = {{name}}WorkFlow()
# get json string of workflow
# print({{name}}_workFlow)
# deploy workflow
print('[+] deploy workflow schema')
print({{name}}_workflow.deploy())
