"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const isEmpty = require("lodash/isEmpty");
const isNil = require("lodash/isNil");
const isObject = require("lodash/isObject");
const isArray = require("lodash/isArray");
const size = require("lodash/size");
const includes = require("lodash/includes");
const filter = require("lodash/filter");
const startsWith = require("lodash/startsWith");
const get = require("lodash/get");
const compact = require("lodash/compact");
const isString = require("lodash/isString");
exports.AVAILABLE_QUERY_OPERATORS = new Set([
    '$eq', '$gt', '$gte', '$lt', '$lte', '$ne', '$in', '$nin',
    '$or', '$and', '$not', '$nor', '$size', '$all', '$elemMatch'
]);
exports.SCHEMAS = new Set(['concepts.schema', 'entities.schema', 'datapoints.schema']);
exports.DATAPOINTS = 'datapoints';
exports.ENTITIES = 'entities';
exports.CONCEPTS = 'concepts';
exports.AVAILABLE_FROM_CLAUSE_VALUES = new Set([
    exports.CONCEPTS, exports.ENTITIES, exports.DATAPOINTS, ...exports.SCHEMAS
]);
const SORT_DIRECTIONS = new Set(['asc', 'desc']);
const MAX_AMOUNT_OF_MEASURES_IN_SELECT = 5;
function validateQueryStructure(query, options = {}) {
    return new Promise((resolve, reject) => {
        const validationResult = [
            ...validateFromStructure(query, options),
            ...validateSelectStructure(query, options),
            ...validateLanguageStructure(query, options),
            ...validateJoinStructure(query, options),
            ...validateOrderByStructure(query, options)
        ];
        const isQueryValid = isEmpty(validationResult);
        if (!isQueryValid) {
            return reject(`Too many errors: \n* ${validationResult.join('\n* ')}`);
        }
        return resolve();
    });
}
exports.validateQueryStructure = validateQueryStructure;
function validateQueryDefinitions(query, options = {}) {
    const validationResult = [
        ...validateSelectDefinitions(query, options),
    ];
    const isQueryValid = isEmpty(validationResult);
    if (!isQueryValid) {
        throw new Error(`Too many errors: \n* ${validationResult.join('\n* ')}`);
    }
}
exports.validateQueryDefinitions = validateQueryDefinitions;
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
function validateFromStructure(query, options) {
    const errorMessages = [];
    const clause = get(query, 'from', null);
    if (isNil(clause)) {
        errorMessages.push(`'from' clause couldn't be empty`);
    }
    if (!isString(clause)) {
        errorMessages.push(`'from' clause must be string only`);
    }
    if (!exports.AVAILABLE_FROM_CLAUSE_VALUES.has(clause)) {
        const listAvaliableValues = [...exports.AVAILABLE_FROM_CLAUSE_VALUES];
        errorMessages.push(`'from' clause must be one of the list: ${listAvaliableValues.join(', ')}`);
    }
    return errorMessages;
}
function validateSelectStructure(query, options) {
    const errorMessages = [];
    const selectClause = get(query, 'select', null);
    const fromClause = get(query, 'from', null);
    const key = get(selectClause, 'key');
    const value = get(selectClause, 'value');
    switch (true) {
        case (isSchemaQuery(query)):
            errorMessages.push(checkIfSelectIsEmpty(selectClause), checkIfSelectHasInvalidStructure(selectClause, key, value), checkIfSchemasSelectKeyHasInvalidStructure(fromClause, key), checkIfSchemasSelectValueHasInvalidStructure(fromClause, value));
            break;
        case (isEntitiesQuery(query)):
            errorMessages.push(checkIfSelectIsEmpty(selectClause), checkIfSelectKeyHasInvalidStructure(fromClause, key));
            break;
        case (isConceptsQuery(query)):
            errorMessages.push(checkIfSelectIsEmpty(selectClause), checkIfSelectKeyHasInvalidStructure(fromClause, key));
            break;
        case (isDatapointsQuery(query)):
            errorMessages.push(checkIfSelectIsEmpty(selectClause), checkIfSelectHasInvalidStructure(selectClause, key, value), checkIfDatapointsSelectKeyHasInvalidStructure(fromClause, key), checkIfDatapointsSelectValueHasInvalidStructure(fromClause, value));
            break;
        default:
            errorMessages.push(checkIfSelectIsEmpty(selectClause));
            break;
    }
    return compact(errorMessages);
}
function validateSelectDefinitions(query, options) {
    const errorMessages = [];
    const selectClause = get(query, 'select', null);
    const fromClause = get(query, 'from', null);
    const key = get(selectClause, 'key');
    const value = get(selectClause, 'value');
    switch (true) {
        case (isSchemaQuery(query)):
            errorMessages.push(...[]);
            break;
        case (isEntitiesQuery(query)):
            errorMessages.push(...[]);
            break;
        case (isConceptsQuery(query)):
            errorMessages.push(...[]);
            break;
        case (isDatapointsQuery(query)):
            errorMessages.push(checkIfSelectKeyHasInvalidDefinitions(fromClause, key, options), checkIfSelectValueHasInvalidDefinitions(fromClause, value, options));
            break;
        default:
            break;
    }
    return compact(errorMessages);
}
function validateWhereStructure(query, options) {
    const errorMessages = [];
    const clausesUnderValidating = [];
    const operatorsUnderValidating = Object.keys(query);
    for (const key of operatorsUnderValidating) {
        if (isInvalidQueryOperator(key.toString())) {
            errorMessages.push('Invalid DDFQL-query. Validation by Operators, not acceptable: ' + key);
        }
    }
    return errorMessages;
}
function validateLanguageStructure(query, options) {
    return [];
}
function validateJoinStructure(query, options) {
    return [];
}
function validateOrderByStructure(query, options) {
    return [];
}
function isInvalidQueryOperator(operator) {
    return startsWith(operator, '$') && !exports.AVAILABLE_QUERY_OPERATORS.has(operator);
}
function isEntityDomainOrSet(conceptType) {
    return includes(['entity_domain', 'entity_set', 'time'], conceptType);
}
function isMeasure(conceptType) {
    return includes(['measure', 'string'], conceptType);
}
function checkIfSelectKeyHasInvalidDefinitions(fromClause, key, options) {
    const unavailableKeys = getUnavailableSelectKeys(key, options);
    if (!isEmpty(unavailableKeys)) {
        return `'select.key' clause for '${fromClause}' queries contains unavailable item(s): ${unavailableKeys.join(', ')} [repo: ${options.basePath}]`;
    }
}
function checkIfSelectValueHasInvalidDefinitions(fromClause, value, options) {
    const unavailableValues = getUnavailableSelectValues(value, options);
    if (!isEmpty(unavailableValues)) {
        return `'select.value' clause for '${fromClause}' queries contains unavailable item(s): ${unavailableValues.join(', ')} [repo: ${options.basePath}]`;
    }
}
function getUnavailableSelectKeys(key, options) {
    return filter(key, (keyItem) => {
        const concept = options.conceptsLookup.get(keyItem);
        if (isNil(concept) || !isEntityDomainOrSet(concept.concept_type)) {
            return true;
        }
        return false;
    });
}
function getUnavailableSelectValues(value, options) {
    return filter(value, (valueItem) => {
        const concept = options.conceptsLookup.get(valueItem);
        if (isNil(concept) || !isMeasure(concept.concept_type)) {
            return true;
        }
        return false;
    });
}
function checkIfSelectIsEmpty(selectClause) {
    if (isNil(selectClause)) {
        return `'select' clause couldn't be empty`;
    }
}
function checkIfSelectHasInvalidStructure(selectClause, key, value) {
    if (!isObject(selectClause) || !isArray(key) || !isArray(value)) {
        return `'select' clause must have next structure: { key: [...], value: [...] }`;
    }
}
function checkIfDatapointsSelectKeyHasInvalidStructure(fromClause, key) {
    if (size(key) < 2) {
        return `'select.key' clause for '${fromClause}' queries must have at least 2 items`;
    }
}
function checkIfDatapointsSelectValueHasInvalidStructure(fromClause, value) {
    if (size(value) < 1) {
        return `'select.value' clause for '${fromClause}' queries must have at least 1 item`;
    }
}
function checkIfSchemasSelectKeyHasInvalidStructure(fromClause, key) {
    if (size(key) < 2) {
        return `'select.key' clause for '${fromClause}' queries must have at least 2 items: 'key', 'value'`;
    }
}
function checkIfSchemasSelectValueHasInvalidStructure(fromClause, value) {
    if (!isArray(value) && !isNil(value)) {
        return `'select.value' clause for '${fromClause}' queries should be array of strings or empty`;
    }
}
function checkIfSelectKeyHasInvalidStructure(fromClause, key) {
    if (!isArray(key) || size(key) !== 1) {
        return `'select.key' clause for '${fromClause}' queries must have only 1 item`;
    }
}
//# sourceMappingURL=index.js.map