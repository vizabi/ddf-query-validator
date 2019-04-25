"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const isEmpty = require("lodash.isempty");
const filter = require("lodash.filter");
const map = require("lodash.map");
const get = require("lodash.get");
const compact = require("lodash.compact");
const includes = require("lodash.includes");
const startsWith = require("lodash.startswith");
const isNil = require("lodash.isnil");
const trimStart = require("lodash.trimstart");
const flatMap = require("lodash.flatmap");
const helper_service_1 = require("./helper.service");
const util_1 = require("util");
function validateQueryDefinitions(query, options = {}) {
    return new Promise((resolve, reject) => {
        const validationResult = [
            ...validateSelectDefinitions(query, options),
            ...validateWhereDefinitions(query, options),
        ];
        const isQueryValid = isEmpty(validationResult);
        if (!isQueryValid) {
            return reject(`Too many query definition errors [repo: ${options.basePath}]: \n* ${validationResult.join('\n* ')}`);
        }
        return resolve();
    });
}
exports.validateQueryDefinitions = validateQueryDefinitions;
function validateSelectDefinitions(query, options) {
    const errorMessages = [];
    const fromClause = get(query, 'from', null);
    const selectClause = get(query, 'select', null);
    const key = get(selectClause, 'key');
    const value = get(selectClause, 'value');
    const ALLOWED_KEYS = [];
    const ALLOWED_VALUES = [];
    const { conceptsLookup } = options;
    switch (true) {
        case helper_service_1.isDatapointsQuery(query):
            const CONCEPT_TYPES_FOR_DATAPOINTS = [helper_service_1.CONCEPT_TYPE_ENTITY_SET, helper_service_1.CONCEPT_TYPE_ENTITY_DOMAIN, helper_service_1.CONCEPT_TYPE_TIME];
            ALLOWED_KEYS.push(...getAllowedConceptGidsByConceptType(CONCEPT_TYPES_FOR_DATAPOINTS, conceptsLookup));
            ALLOWED_VALUES.push(...conceptsLookup.keys());
            break;
        case (helper_service_1.isEntitiesQuery(query)):
            const CONCEPT_TYPES_FOR_ENTITIES = [helper_service_1.CONCEPT_TYPE_ENTITY_SET, helper_service_1.CONCEPT_TYPE_ENTITY_DOMAIN];
            ALLOWED_KEYS.push(...getAllowedConceptGidsByConceptType(CONCEPT_TYPES_FOR_ENTITIES, conceptsLookup));
            ALLOWED_VALUES.push(...conceptsLookup.keys());
            break;
        case (helper_service_1.isConceptsQuery(query)):
            ALLOWED_KEYS.push(helper_service_1.RESERVED_CONCEPT);
            ALLOWED_VALUES.push(...conceptsLookup.keys(), helper_service_1.RESERVED_CONCEPT, helper_service_1.RESERVED_CONCEPT_TYPE, helper_service_1.RESERVED_DOMAIN, helper_service_1.RESERVED_UNIT, helper_service_1.RESERVED_DRILL_UP);
            break;
        default:
            ALLOWED_KEYS.push(helper_service_1.RESERVED_KEY, helper_service_1.RESERVED_VALUE);
            ALLOWED_VALUES.push(helper_service_1.RESERVED_KEY, helper_service_1.RESERVED_VALUE);
            break;
    }
    errorMessages.push(checkIfSelectKeyHasInvalidDefinitions(fromClause, key, ALLOWED_KEYS), checkIfSelectValueHasInvalidDefinitions(query, value, ALLOWED_VALUES));
    return compact(errorMessages);
}
function validateWhereDefinitions(query, options) {
    if (query.debug !== true) {
        return [];
    }
    const errorMessages = [];
    const whereClause = get(query, 'where', null);
    const fromClause = get(query, 'from', null);
    const selectClause = get(query, 'select', null);
    const key = get(selectClause, 'key');
    const value = get(selectClause, 'value');
    const operators = getWhereOperators(whereClause);
    const { conceptsLookup } = options;
    switch (true) {
        case helper_service_1.isDatapointsQuery(query):
            const CONCEPT_TYPES_FOR_DATAPOINTS = [];
            CONCEPT_TYPES_FOR_DATAPOINTS.push(helper_service_1.CONCEPT_TYPE_ENTITY_SET, helper_service_1.CONCEPT_TYPE_ENTITY_DOMAIN, helper_service_1.CONCEPT_TYPE_TIME);
            errorMessages.push();
            break;
        default:
            break;
    }
    return compact(errorMessages);
}
function getWhereOperators(whereClause) {
    const operators = {};
    getWhereOperatorsRecursively(whereClause, operators);
    return operators;
}
function getWhereOperatorsRecursively(whereClause, operators, candidate) {
    for (const field in whereClause) {
        const hasCandidate = !isNil(candidate);
        const isCandidate = !hasCandidate && !startsWith(field, '$') && isNaN(+field);
        const [domain, ...set] = field.split('.');
        if (isCandidate) {
            if (isNil(operators[domain])) {
                operators[trimStart(domain, 'is--')] = [];
            }
            if (!isEmpty(set)) {
                operators[domain].push(trimStart(set.join('.'), 'is--'));
            }
        }
        if (util_1.isPrimitive(whereClause[field])) {
            continue;
        }
        getWhereOperatorsRecursively(whereClause[field], operators, isCandidate ? domain : candidate);
    }
}
function checkIfSelectKeyHasInvalidDefinitions(fromClause, key, ALLOWED_KEYS) {
    const unavailableKeys = getUnavailableSelectItems(key, ALLOWED_KEYS);
    if (!isEmpty(unavailableKeys)) {
        return `'select.key' clause for '${fromClause}' query contains unavailable item(s): ${unavailableKeys.join(', ')}`;
    }
}
function checkIfSelectValueHasInvalidDefinitions(query, value, ALLOWED_VALUES) {
    if (query.debug !== true) {
        return;
    }
    const fromClause = get(query, 'from', null);
    const unavailableValues = getUnavailableSelectItems(value, ALLOWED_VALUES);
    if (!isEmpty(value) && !isEmpty(unavailableValues)) {
        return `'select.value' clause for '${fromClause}' query contains unavailable item(s): ${unavailableValues.join(', ')}`;
    }
}
function checkIfWhereHasAbsentDefinitions(fromClause, candidates, conceptsLookup) {
    const unavailableValues = filter(candidates, (candidate) => !conceptsLookup.has(candidate));
    if (!isEmpty(unavailableValues)) {
        return `'where' clause for '${fromClause}' query contains unavailable item(s) that is not present in dataset: ${unavailableValues.join(', ')}`;
    }
}
function checkIfWhereHasUnavailableDimensionDefinitions(fromClause, candidates, select) {
    const unavailableValues = filter(candidates, (candidate) => !includes(select, candidate));
    if (!isEmpty(unavailableValues)) {
        return `'where' clause for '${fromClause}' query contains item(s) that is not present in 'select': ${unavailableValues.join(', ')}`;
    }
}
function checkIfWhereHasWrongRelativesDefinitions(fromClause, operators, conceptsLookup) {
    const unavailableValues = flatMap(operators, (children, parent) => {
        const unavailableChildren = map(children, (child) => {
            const childConcept = conceptsLookup.get(child);
            return childConcept.domain === parent || childConcept.drill_up === parent ? null : `${parent}.${child}`;
        });
        return unavailableChildren;
    });
    if (!isEmpty(unavailableValues)) {
        return `'where' clause for '${fromClause}' query contains item(s) that has wrong relatives: ${compact(unavailableValues).join(', ')}`;
    }
}
function getUnavailableSelectItems(selectItems, ALLOWED_ITEMS) {
    return filter(selectItems, (value) => !includes(ALLOWED_ITEMS, value));
}
function getAllowedConceptGidsByConceptType(allowedConceptTypes, conceptsLookup) {
    const filteredAllowedConcepts = filter([...conceptsLookup.values()], ({ concept_type }) => includes(allowedConceptTypes, concept_type));
    return map(filteredAllowedConcepts, 'concept');
}
//# sourceMappingURL=definition.service.js.map