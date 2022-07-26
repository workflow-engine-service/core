# `admin_users` config namespace

you must at least one admin user to connect workflow service. set admin users on workflow engine as hard coded
> you can set custom role for your admin users


sample code:
```json
"admin_users": [
    {
        "username": "admin",
        "secretkey": "admin",
        "roles": [
            "admin"
        ]
    }
],
```

### properties

| name | type | required | Description |
| ----------- | ----------- |----------- |----------- |
| username | string | YES | - |
| secretkey | string | YES | recommend that admin secret key be very hard | 
| roles | string[] | NO | you can set custom roles for your admin user (default: `[_admin_]`) |
