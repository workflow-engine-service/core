import { SwaggerDataType, SwaggerDataTypeFormat } from "../types";


export interface SwaggerDefinition {
    type: SwaggerDataType;
    properties: {
        [k: string]: {
            type: SwaggerDataType;
            format?: SwaggerDataTypeFormat;
        }
    };
    required?: string[];
}
export interface SwaggerApiResponse {
    description: string;
    // content?: {
    //     [k in 'application/json' | '*/*' | 'application/x-www-form-urlencoded']?: {
    //         schema?: {
    //             $ref?: string;
    //             type: SwaggerDataType;
    //             items?: object;
    //         };
    //     };
    // };
    schema?: {
        type?: SwaggerDataType;
        items?: {};
        $ref?: string;
    };
    example?: string;

}
export interface SwaggerApiParameter {
    name: string;
    summary?: string;
    description?: string;
    example?: any;
    /**
     * path parameters, such as /users/{id}
     * query parameters, such as /users?role=admin
     * header parameters, such as X-MyHeader: Value
     * cookie parameters, which are passed in the Cookie header, such as Cookie: debug=0; csrftoken=BUSe35dohU3O1MZvDCU
     */
    in: 'query' | 'path' | 'header' | 'cookie' | 'body';
    required?: boolean;
    type?: SwaggerDataType;
    format?: SwaggerDataTypeFormat;
    allowEmptyValue?: boolean;
    schema?: {
        type?: SwaggerDataType;
        properties?: {
            [k: string]: {
                type?: SwaggerDataType;
                format?: SwaggerDataTypeFormat;
                default?: any;
            };
        };
        defaultProperties?: any;
    };
    /**
     * for array type
     */
    items?: {
        type?: SwaggerDataType;
        format?: SwaggerDataTypeFormat;
        enum?: string[];
        defalut?: any;
    };
    collectionFormat?: 'multi';
    defalut?: any;
}
