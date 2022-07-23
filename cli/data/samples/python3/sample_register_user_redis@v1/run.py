import time
from sample_register_user_redis import sample_register_user_redis_workFlow

print('[+] init workflow class')
sample_workFlow = sample_register_user_redis_workFlow()
# deploy workflow
print('[+] deploy workflow schema')
print(sample_workFlow.deploy())
# create new process
print('[+] create workflow process')
newProcess, message = sample_workFlow.create()
# print(newProcess)
print('[+] get current state of process')
# get current state info
state = newProcess.currentState()
print(state)
# execute 'approve' action of state
print("[+] execute 'approve' action")
worker = newProcess.executeAction(state.getActionByName(
    'approve'), fields={'email': 'sample@gmail.com'})
print(worker)
if type(worker) == str:
    print('error for create worker')
    exit(1)
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
print(newProcess.update())
# go to finish state, if success
if worker.is_success():
    print('[+] go to finish state')
    finishWorker = newProcess.executeAction(state.getActionByName('approve'))
