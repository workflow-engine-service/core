# Calculator

you can set an calculator object instead of constant values on some fields.

## calculator usage

- job time

## samples

### simple condition

for `if (myfield > 5) return 'state3' else 'state4'`

calculator code:
```json
{
    "__if": {
        "__gt": [
            {"__field": "myfield"}, 
            {"__const": 5}
        ]
    },
    "__then": {"__const": "state3"},
    "__else": {"__const": "state4"},
}
```

### simple field return

for `myfield * 2`

calculator code:
```json
{
   "__mul": [
       {"__field": "myfield"}, 
       {"__const": 2}
    ]
}
```

### more complex condition

for `if (fieldnum == 5 or fieldnum > 5) return field2 else return 'state1'`

calculator code:
```json
{
    "__if": {
        "__or": [
            { "__eq": [
                { "__field": "fieldnum" }, 
                { "__const": 5 }
                ] 
            },
            { "__gt": [
                { "__field": "fieldnum" },
                 { "__const": 5 }
                ] 
            },
        ],
    },
    "__then": { "__field": "field2" },
    "__else": { "__const": "state1" },
}
```