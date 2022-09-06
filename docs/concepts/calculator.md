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
    "$if": {
        "$gt": [
            {"$field": "myfield"}, 
            {"$const": 5}
        ]
    },
    "$then": {"$const": "state3"},
    "$else": {"$const": "state4"},
}
```

### simple field return

for `myfield * 2`

calculator code:
```json
{
   "$mul": [
       {"$field": "myfield"}, 
       {"$const": 2}
    ]
}
```

### more complex condition

for `if (fieldnum == 5 or fieldnum > 5) return field2 else return 'state1'`

calculator code:
```json
{
    "$if": {
        "$or": [
            { "$eq": [
                { "$field": "fieldnum" }, 
                { "$const": 5 }
                ] 
            },
            { "$gt": [
                { "$field": "fieldnum" },
                 { "$const": 5 }
                ] 
            },
        ],
    },
    "$then": { "$field": "field2" },
    "$else": { "$const": "state1" },
}
```