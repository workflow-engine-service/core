# the new command

> **just support `python3` language for now**

for generate new workflow interfaces.
the `new` command is used like this
```shell
dat p n -n sample_workflow
```

## most used parameters:

### name (n)
workflow name that need to create

### language (l)
language to generate interface files 

**programming languages to support:**
- python3 (default)

### version (v)
version of workflow (default : 1)

### output (o)
directory path for generate interface files

### overwrite (ow)

force to overwrite workflow interfaces, if exist