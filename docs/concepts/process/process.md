# Process

A process is an instance of a deployed workflow. you can create new process like this:
```bash
curl -X 'POST' \
  'http://localhost:8082/api/v1/workflow/create' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "name": "sample_workflow",
  "version": 1
}'
```

> if you do not specify workflow version, in default create process from with latest version of that workflow