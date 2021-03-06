"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const get = require("lodash.get");
const includes = require("lodash.includes");
exports.SCHEMAS = new Set(['concepts.schema', 'entities.schema', 'datapoints.schema', '*.schema']);
exports.DATAPOINTS = 'datapoints';
exports.ENTITIES = 'entities';
exports.CONCEPTS = 'concepts';
exports.CONCEPT_TYPE_MEASURE = 'measure';
exports.CONCEPT_TYPE_STRING = 'string';
exports.CONCEPT_TYPE_ENTITY_DOMAIN = 'entity_domain';
exports.CONCEPT_TYPE_ENTITY_SET = 'entity_set';
exports.CONCEPT_TYPE_TIME = 'time';
exports.RESERVED_CONCEPT = 'concept';
exports.RESERVED_CONCEPT_TYPE = 'concept_type';
exports.RESERVED_DOMAIN = 'domain';
exports.RESERVED_UNIT = 'unit';
exports.RESERVED_DRILL_UP = 'drill_up';
exports.RESERVED_KEY = 'key';
exports.RESERVED_VALUE = 'value';
exports.AVAILABLE_QUERY_OPERATORS = new Set([
    '$eq', '$gt', '$gte', '$lt', '$lte', '$ne', '$in', '$nin',
    '$or', '$and', '$not', '$nor', '$size', '$all', '$elemMatch'
]);
exports.AVAILABLE_FROM_CLAUSE_VALUES = new Set([
    exports.CONCEPTS, exports.ENTITIES, exports.DATAPOINTS, ...exports.SCHEMAS
]);
exports.AVAILABLE_ORDER_BY_CLAUSE_VALUES = new Set([
    'asc', 'desc', 1, -1
]);
exports.DEFAULT_REPOSITORY_NAME = process.env.DEFAULT_REPOSITORY_NAME || 'systema_globalis';
exports.DEFAULT_REPOSITORY_BRANCH = process.env.DEFAULT_REPOSITORY_BRANCH || 'master';
exports.DEFAULT_REPOSITORY_HASH = 'HEAD';
function isSchemaQuery(query) {
    const fromClause = get(query, 'from');
    return exports.SCHEMAS.has(fromClause);
}
exports.isSchemaQuery = isSchemaQuery;
function isDatapointsQuery(query) {
    const fromClause = get(query, 'from');
    return fromClause === exports.DATAPOINTS;
}
exports.isDatapointsQuery = isDatapointsQuery;
function isEntitiesQuery(query) {
    const fromClause = get(query, 'from');
    return fromClause === exports.ENTITIES;
}
exports.isEntitiesQuery = isEntitiesQuery;
function isConceptsQuery(query) {
    const fromClause = get(query, 'from');
    return fromClause === exports.CONCEPTS;
}
exports.isConceptsQuery = isConceptsQuery;
function isEntityDomainOrSet(conceptType, allowedValues) {
    return includes(allowedValues, conceptType);
}
exports.isEntityDomainOrSet = isEntityDomainOrSet;
function isMeasure(conceptType) {
    return includes([exports.CONCEPT_TYPE_MEASURE], conceptType);
}
exports.isMeasure = isMeasure;
function isIndicator(conceptType) {
    return includes([exports.CONCEPT_TYPE_MEASURE, exports.CONCEPT_TYPE_STRING], conceptType);
}
exports.isIndicator = isIndicator;
//# sourceMappingURL=helper.service.js.map