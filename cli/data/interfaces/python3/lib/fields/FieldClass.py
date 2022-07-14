import json


class FieldClass():
    def __init__(self) -> None:
        pass

    def __str__(self) -> str:
        schema = []
        for key in self.__dir__():
            if key.startswith('__'):
                continue
            if not getattr(self, key).hasName():
                getattr(self, key).setName(key)
            schema.append(json.loads(str(getattr(self, key))))
        return json.dumps(schema)
