import time
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
newProcess, message = {{name}}_workflow.create()
# print(newProcess)
print('[+] get current state of process')
# get current state info
state = newProcess.currentState()
print(state)
# execute 'approve' action of state
print("[+] execute 'approve' action")
worker = newProcess.executeAction(state.getActionByName('approve'))
print(worker)
# follow worker
print("[+] follow up worker created for execute action")
while True:
    time.sleep(1)
    # =>check for success exec action
    worker.info()
    if worker.is_success():
        print('success')
        break
    elif not worker.is_pending() and not worker.is_success():
        print('failed')
        break

print(worker)
