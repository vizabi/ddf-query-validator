"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateQueryDefinitions = validateQueryDefinitions;
const isEmpty_1 = __importDefault(require("lodash-es/isEmpty"));
const filter_1 = __importDefault(require("lodash-es/filter"));
const map_1 = __importDefault(require("lodash-es/map"));
const get_1 = __importDefault(require("lodash-es/get"));
const compact_1 = __importDefault(require("lodash-es/compact"));
const includes_1 = __importDefault(require("lodash-es/includes"));
const startsWith_1 = __importDefault(require("lodash-es/startsWith"));
const isNil_1 = __importDefault(require("lodash-es/isNil"));
const trimStart_1 = __importDefault(require("lodash-es/trimStart"));
const flatMap_1 = __importDefault(require("lodash-es/flatMap"));
const helper_service_1 = require("./helper.service");
function isPrimitive(value) {
    return (typeof value !== 'object' && typeof value !== 'function') || value === null;
}
function validateQueryDefinitions(query, options = {}) {
    return new Promise((resolve, reject) => {
        const validationResult = [
            ...validateSelectDefinitions(query, options),
            ...validateWhereDefinitions(query, options),
        ];
        const isQueryValid = (0, isEmpty_1.default)(validationResult);
        if (!isQueryValid) {
            return reject(`Too many query definition errors [repo: ${options.basePath}]: \n* ${validationResult.join('\n* ')}`);
        }
        return resolve();
    });
}
function validateSelectDefinitions(query, options) {
    const errorMessages = [];
    const fromClause = (0, get_1.default)(query, 'from', null);
    const selectClause = (0, get_1.default)(query, 'select', null);
    const key = (0, get_1.default)(selectClause, 'key');
    const value = (0, get_1.default)(selectClause, 'value');
    const ALLOWED_KEYS = [];
    const ALLOWED_VALUES = [];
    const { conceptsLookup } = options;
    switch (true) {
        case (0, helper_service_1.isDatapointsQuery)(query):
            const CONCEPT_TYPES_FOR_DATAPOINTS = [helper_service_1.CONCEPT_TYPE_ENTITY_SET, helper_service_1.CONCEPT_TYPE_ENTITY_DOMAIN, helper_service_1.CONCEPT_TYPE_TIME];
            ALLOWED_KEYS.push(...getAllowedConceptGidsByConceptType(CONCEPT_TYPES_FOR_DATAPOINTS, conceptsLookup));
            ALLOWED_VALUES.push(...conceptsLookup.keys());
            break;
        case ((0, helper_service_1.isEntitiesQuery)(query)):
            const CONCEPT_TYPES_FOR_ENTITIES = [helper_service_1.CONCEPT_TYPE_ENTITY_SET, helper_service_1.CONCEPT_TYPE_ENTITY_DOMAIN];
            ALLOWED_KEYS.push(...getAllowedConceptGidsByConceptType(CONCEPT_TYPES_FOR_ENTITIES, conceptsLookup));
            ALLOWED_VALUES.push(...conceptsLookup.keys());
            break;
        case ((0, helper_service_1.isConceptsQuery)(query)):
            ALLOWED_KEYS.push(helper_service_1.RESERVED_CONCEPT);
            ALLOWED_VALUES.push(...conceptsLookup.keys(), helper_service_1.RESERVED_CONCEPT, helper_service_1.RESERVED_CONCEPT_TYPE, helper_service_1.RESERVED_DOMAIN, helper_service_1.RESERVED_UNIT, helper_service_1.RESERVED_DRILL_UP);
            break;
        default:
            ALLOWED_KEYS.push(helper_service_1.RESERVED_KEY, helper_service_1.RESERVED_VALUE);
            ALLOWED_VALUES.push(helper_service_1.RESERVED_KEY, helper_service_1.RESERVED_VALUE);
            break;
    }
    errorMessages.push(checkIfSelectKeyHasInvalidDefinitions(fromClause, key, ALLOWED_KEYS), checkIfSelectValueHasInvalidDefinitions(query, value, ALLOWED_VALUES));
    return (0, compact_1.default)(errorMessages);
}
function validateWhereDefinitions(query, options) {
    if (query.debug !== true) {
        return [];
    }
    const errorMessages = [];
    const whereClause = (0, get_1.default)(query, 'where', null);
    const fromClause = (0, get_1.default)(query, 'from', null);
    const selectClause = (0, get_1.default)(query, 'select', null);
    const key = (0, get_1.default)(selectClause, 'key');
    const value = (0, get_1.default)(selectClause, 'value');
    const operators = getWhereOperators(whereClause);
    const { conceptsLookup } = options;
    switch (true) {
        case (0, helper_service_1.isDatapointsQuery)(query):
            const CONCEPT_TYPES_FOR_DATAPOINTS = [];
            CONCEPT_TYPES_FOR_DATAPOINTS.push(helper_service_1.CONCEPT_TYPE_ENTITY_SET, helper_service_1.CONCEPT_TYPE_ENTITY_DOMAIN, helper_service_1.CONCEPT_TYPE_TIME);
            errorMessages.push();
            break;
        default:
            break;
    }
    return (0, compact_1.default)(errorMessages);
}
function getWhereOperators(whereClause) {
    const operators = {};
    getWhereOperatorsRecursively(whereClause, operators);
    return operators;
}
function getWhereOperatorsRecursively(whereClause, operators, candidate) {
    for (const field in whereClause) {
        const hasCandidate = !(0, isNil_1.default)(candidate);
        const isCandidate = !hasCandidate && !(0, startsWith_1.default)(field, '$') && isNaN(+field);
        const [domain, ...set] = field.split('.');
        if (isCandidate) {
            if ((0, isNil_1.default)(operators[domain])) {
                operators[(0, trimStart_1.default)(domain, 'is--')] = [];
            }
            if (!(0, isEmpty_1.default)(set)) {
                operators[domain].push((0, trimStart_1.default)(set.join('.'), 'is--'));
            }
        }
        if (isPrimitive(whereClause[field])) {
            continue;
        }
        getWhereOperatorsRecursively(whereClause[field], operators, isCandidate ? domain : candidate);
    }
}
function checkIfSelectKeyHasInvalidDefinitions(fromClause, key, ALLOWED_KEYS) {
    const unavailableKeys = getUnavailableSelectItems(key, ALLOWED_KEYS);
    if (!(0, isEmpty_1.default)(unavailableKeys)) {
        return `'select.key' clause for '${fromClause}' query contains unavailable item(s): ${unavailableKeys.join(', ')}`;
    }
}
function checkIfSelectValueHasInvalidDefinitions(query, value, ALLOWED_VALUES) {
    if (query.debug !== true) {
        return;
    }
    const fromClause = (0, get_1.default)(query, 'from', null);
    const unavailableValues = getUnavailableSelectItems(value, ALLOWED_VALUES);
    if (!(0, isEmpty_1.default)(value) && !(0, isEmpty_1.default)(unavailableValues)) {
        return `'select.value' clause for '${fromClause}' query contains unavailable item(s): ${unavailableValues.join(', ')}`;
    }
}
function checkIfWhereHasAbsentDefinitions(fromClause, candidates, conceptsLookup) {
    const unavailableValues = (0, filter_1.default)(candidates, (candidate) => !conceptsLookup.has(candidate));
    if (!(0, isEmpty_1.default)(unavailableValues)) {
        return `'where' clause for '${fromClause}' query contains unavailable item(s) that is not present in dataset: ${unavailableValues.join(', ')}`;
    }
}
function checkIfWhereHasUnavailableDimensionDefinitions(fromClause, candidates, select) {
    const unavailableValues = (0, filter_1.default)(candidates, (candidate) => !(0, includes_1.default)(select, candidate));
    if (!(0, isEmpty_1.default)(unavailableValues)) {
        return `'where' clause for '${fromClause}' query contains item(s) that is not present in 'select': ${unavailableValues.join(', ')}`;
    }
}
function checkIfWhereHasWrongRelativesDefinitions(fromClause, operators, conceptsLookup) {
    const unavailableValues = (0, flatMap_1.default)(operators, (children, parent) => {
        const unavailableChildren = (0, map_1.default)(children, (child) => {
            const childConcept = conceptsLookup.get(child);
            return childConcept.domain === parent || childConcept.drill_up === parent ? null : `${parent}.${child}`;
        });
        return unavailableChildren;
    });
    if (!(0, isEmpty_1.default)(unavailableValues)) {
        return `'where' clause for '${fromClause}' query contains item(s) that has wrong relatives: ${(0, compact_1.default)(unavailableValues).join(', ')}`;
    }
}
function getUnavailableSelectItems(selectItems, ALLOWED_ITEMS) {
    return (0, filter_1.default)(selectItems, (value) => !(0, includes_1.default)(ALLOWED_ITEMS, value));
}
function getAllowedConceptGidsByConceptType(allowedConceptTypes, conceptsLookup) {
    const filteredAllowedConcepts = (0, filter_1.default)([...conceptsLookup.values()], ({ concept_type }) => (0, includes_1.default)(allowedConceptTypes, concept_type));
    return (0, map_1.default)(filteredAllowedConcepts, 'concept');
}
//# sourceMappingURL=definition.service.js.map