export declare const SCHEMAS: Set<string>;
export declare const DATAPOINTS = "datapoints";
export declare const ENTITIES = "entities";
export declare const CONCEPTS = "concepts";
export declare const CONCEPT_TYPE_MEASURE = "measure";
export declare const CONCEPT_TYPE_STRING = "string";
export declare const CONCEPT_TYPE_ENTITY_DOMAIN = "entity_domain";
export declare const CONCEPT_TYPE_ENTITY_SET = "entity_set";
export declare const CONCEPT_TYPE_TIME = "time";
export declare const RESERVED_CONCEPT = "concept";
export declare const RESERVED_CONCEPT_TYPE = "concept_type";
export declare const RESERVED_DOMAIN = "domain";
export declare const RESERVED_UNIT = "unit";
export declare const RESERVED_DRILL_UP = "drill_up";
export declare const RESERVED_KEY = "key";
export declare const RESERVED_VALUE = "value";
export declare const AVAILABLE_QUERY_OPERATORS: Set<string>;
export declare const AVAILABLE_FROM_CLAUSE_VALUES: Set<string>;
export declare const AVAILABLE_ORDER_BY_CLAUSE_VALUES: Set<string | number>;
export declare const DEFAULT_REPOSITORY_NAME: string;
export declare const DEFAULT_REPOSITORY_BRANCH: string;
export declare const DEFAULT_REPOSITORY_HASH = "HEAD";
export declare function isSchemaQuery(query: any): boolean;
export declare function isDatapointsQuery(query: any): boolean;
export declare function isEntitiesQuery(query: any): boolean;
export declare function isConceptsQuery(query: any): boolean;
export declare function isEntityDomainOrSet(conceptType: string, allowedValues: string[]): boolean;
export declare function isMeasure(conceptType: string): boolean;
export declare function isIndicator(conceptType: string): boolean;
