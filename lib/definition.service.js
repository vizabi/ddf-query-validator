"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const isEmpty_1 = require("lodash-es/isEmpty");
const filter_1 = require("lodash-es/filter");
const map_1 = require("lodash-es/map");
const get_1 = require("lodash-es/get");
const compact_1 = require("lodash-es/compact");
const includes_1 = require("lodash-es/includes");
const startsWith_1 = require("lodash-es/startsWith");
const isNil_1 = require("lodash-es/isNil");
const trimStart_1 = require("lodash-es/trimStart");
const flatMap_1 = require("lodash-es/flatMap");
const helper_service_1 = require("./helper.service");
const util_1 = require("util");
function validateQueryDefinitions(query, options = {}) {
    return new Promise((resolve, reject) => {
        const validationResult = [
            ...validateSelectDefinitions(query, options),
            ...validateWhereDefinitions(query, options),
        ];
        const isQueryValid = isEmpty_1.default(validationResult);
        if (!isQueryValid) {
            return reject(`Too many query definition errors [repo: ${query.dataset}]: \n* ${validationResult.join('\n* ')}`);
        }
        return resolve();
    });
}
exports.validateQueryDefinitions = validateQueryDefinitions;
function validateSelectDefinitions(query, options) {
    const errorMessages = [];
    const fromClause = get_1.default(query, 'from', null);
    const selectClause = get_1.default(query, 'select', null);
    const key = get_1.default(selectClause, 'key');
    const value = get_1.default(selectClause, 'value');
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
    errorMessages.push(checkIfSelectKeyHasInvalidDefinitions(fromClause, key, ALLOWED_KEYS), checkIfSelectValueHasInvalidDefinitions(fromClause, value, ALLOWED_VALUES));
    return compact_1.default(errorMessages);
}
function validateWhereDefinitions(query, options) {
    const errorMessages = [];
    const whereClause = get_1.default(query, 'where', null);
    const fromClause = get_1.default(query, 'from', null);
    const selectClause = get_1.default(query, 'select', null);
    const key = get_1.default(selectClause, 'key');
    const value = get_1.default(selectClause, 'value');
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
    return compact_1.default(errorMessages);
}
function getWhereOperators(whereClause) {
    const operators = {};
    getWhereOperatorsRecursively(whereClause, operators);
    return operators;
}
function getWhereOperatorsRecursively(whereClause, operators, сandidate) {
    for (const field in whereClause) {
        const hasCandidate = !isNil_1.default(сandidate);
        const isCandidate = !hasCandidate && !startsWith_1.default(field, '$') && isNaN(+field);
        const [domain, ...set] = field.split('.');
        if (isCandidate) {
            if (isNil_1.default(operators[domain])) {
                operators[trimStart_1.default(domain, 'is--')] = [];
            }
            if (!isEmpty_1.default(set)) {
                operators[domain].push(trimStart_1.default(set.join('.'), 'is--'));
            }
        }
        if (util_1.isPrimitive(whereClause[field])) {
            continue;
        }
        getWhereOperatorsRecursively(whereClause[field], operators, isCandidate ? domain : сandidate);
    }
}
function checkIfSelectKeyHasInvalidDefinitions(fromClause, key, ALLOWED_KEYS) {
    const unavailableKeys = getUnavailableSelectItems(key, ALLOWED_KEYS);
    if (!isEmpty_1.default(unavailableKeys)) {
        return `'select.key' clause for '${fromClause}' query contains unavailable item(s): ${unavailableKeys.join(', ')}`;
    }
}
function checkIfSelectValueHasInvalidDefinitions(fromClause, value, ALLOWED_VALUES) {
    const unavailableValues = getUnavailableSelectItems(value, ALLOWED_VALUES);
    if (!isEmpty_1.default(value) && !isEmpty_1.default(unavailableValues)) {
        return `'select.value' clause for '${fromClause}' query contains unavailable item(s): ${unavailableValues.join(', ')}`;
    }
}
function checkIfWhereHasAbsentDefinitions(fromClause, candidates, conceptsLookup) {
    const unavailableValues = filter_1.default(candidates, (candidate) => !conceptsLookup.has(candidate));
    if (!isEmpty_1.default(unavailableValues)) {
        return `'where' clause for '${fromClause}' query contains unavailable item(s) that is not present in dataset: ${unavailableValues.join(', ')}`;
    }
}
function checkIfWhereHasUnavailableDimensionDefinitions(fromClause, candidates, select) {
    const unavailableValues = filter_1.default(candidates, (candidate) => !includes_1.default(select, candidate));
    if (!isEmpty_1.default(unavailableValues)) {
        return `'where' clause for '${fromClause}' query contains item(s) that is not present in 'select': ${unavailableValues.join(', ')}`;
    }
}
function checkIfWhereHasWrongRelativesDefinitions(fromClause, operators, conceptsLookup) {
    const unavailableValues = flatMap_1.default(operators, (children, parent) => {
        const unavailableChildren = map_1.default(children, (child) => {
            const childConcept = conceptsLookup.get(child);
            return childConcept.domain === parent || childConcept.drill_up === parent ? null : `${parent}.${child}`;
        });
        return unavailableChildren;
    });
    if (!isEmpty_1.default(unavailableValues)) {
        return `'where' clause for '${fromClause}' query contains item(s) that has wrong relatives: ${compact_1.default(unavailableValues).join(', ')}`;
    }
}
function getUnavailableSelectItems(selectItems, ALLOWED_ITEMS) {
    return filter_1.default(selectItems, (value) => !includes_1.default(ALLOWED_ITEMS, value));
}
function getAllowedConceptGidsByConceptType(allowedConceptTypes, conceptsLookup) {
    const filteredAllowedConcepts = filter_1.default([...conceptsLookup.values()], ({ concept_type }) => includes_1.default(allowedConceptTypes, concept_type));
    return map_1.default(filteredAllowedConcepts, 'concept');
}
//# sourceMappingURL=definition.service.js.map