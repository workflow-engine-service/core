# Configure

for customize default configure, if you in development mode, must edit `configs.dev.json` and if in production mode, you need to edit `configs.prod.json` file in project root
> `configs.prod.json` file not in git tracking and you should create it for self.

configs json file includes some namespaces that some is required to set (for development mode) and some is optional. 

> after update `configs.prod.json` file (in production mode), you should to reset workflow engine by command `dat p i` ([install command](../cli/install_command.md))

## config namespaces

- [redis](./redis.md) (*optional*)
- [mongo](./mongo.md) (**required**)
- [server](./server.md) (**required**)
- [admin_users](./admin_users.md) (**required**)
- [auth_user](./auth_user.md) (**required**)
- [docker](./docker.md) (*optional*) (just for production)
- [alias](./alias.md.md) (*optional*)

