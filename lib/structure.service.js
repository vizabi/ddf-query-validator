"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateQueryStructure = validateQueryStructure;
exports.getVersion = getVersion;
const isEmpty_1 = require("lodash-es/isEmpty");
const isNil_1 = require("lodash-es/isNil");
const isObject_1 = require("lodash-es/isObject");
const isArray_1 = require("lodash-es/isArray");
const size_1 = require("lodash-es/size");
const cloneDeep_1 = require("lodash-es/cloneDeep");
const values_1 = require("lodash-es/values");
const keys_1 = require("lodash-es/keys");
const map_1 = require("lodash-es/map");
const flatMap_1 = require("lodash-es/flatMap");
const first_1 = require("lodash-es/first");
const filter_1 = require("lodash-es/filter");
const startsWith_1 = require("lodash-es/startsWith");
const get_1 = require("lodash-es/get");
const has_1 = require("lodash-es/has");
const every_1 = require("lodash-es/every");
const compact_1 = require("lodash-es/compact");
const isString_1 = require("lodash-es/isString");
const includes_1 = require("lodash-es/includes");
const uniq_1 = require("lodash-es/uniq");
const helper_service_1 = require("./helper.service");
function isPrimitive(value) {
    return (typeof value !== 'object' && typeof value !== 'function') || value === null;
}
function validateQueryStructure(query, options = {}) {
    return new Promise((resolve, reject) => {
        const validationResult = [
            ...validateDatasetStructure(query, options),
            ...validateFromStructure(query, options),
            ...validateSelectStructure(query, options),
            ...validateWhereStructure(query, options),
            ...validateLanguageStructure(query, options),
            ...validateJoinStructure(query, options),
            ...validateOrderByStructure(query, options),
        ];
        const isQueryValid = (0, isEmpty_1.default)(validationResult);
        if (!isQueryValid) {
            return reject(`Too many query structure errors: \n* ${validationResult.join('\n* ')}`);
        }
        return resolve();
    });
}
function getVersion() {
    return process.env.npm_package_version;
}
function validateDatasetStructure(query, options) {
    const errorMessages = [];
    const datasetClause = (0, get_1.default)(query, 'dataset');
    const branchClause = (0, get_1.default)(query, 'branch');
    const commitClause = (0, get_1.default)(query, 'commit');
    if (!(0, isNil_1.default)(datasetClause) && !(0, isString_1.default)(datasetClause)) {
        errorMessages.push(`'dataset' clause must be string only`);
    }
    if (!(0, isNil_1.default)(branchClause) && !(0, isString_1.default)(branchClause)) {
        errorMessages.push(`'branch' clause must be string only`);
    }
    if (!(0, isNil_1.default)(commitClause) && !(0, isString_1.default)(commitClause)) {
        errorMessages.push(`'commit' clause must be string only`);
    }
    return errorMessages;
}
function validateFromStructure(query, options) {
    const errorMessages = [];
    const clause = (0, get_1.default)(query, 'from', null);
    if ((0, isNil_1.default)(clause)) {
        errorMessages.push(`'from' clause couldn't be empty`);
    }
    if (!(0, isString_1.default)(clause)) {
        errorMessages.push(`'from' clause must be string only`);
    }
    if (!helper_service_1.AVAILABLE_FROM_CLAUSE_VALUES.has(clause)) {
        const listAvaliableValues = [...helper_service_1.AVAILABLE_FROM_CLAUSE_VALUES];
        errorMessages.push(`'from' clause must be one of the list: ${listAvaliableValues.join(', ')}`);
    }
    return errorMessages;
}
function validateSelectStructure(query, options) {
    const errorMessages = [];
    const selectClause = (0, get_1.default)(query, 'select', null);
    const fromClause = (0, get_1.default)(query, 'from', null);
    const key = (0, get_1.default)(selectClause, 'key');
    const value = (0, get_1.default)(selectClause, 'value');
    switch (true) {
        case ((0, helper_service_1.isSchemaQuery)(query)):
            errorMessages.push(checkIfSelectIsEmpty(selectClause), checkIfSchemasSelectKeyHasInvalidStructure(fromClause, key), checkIfSelectValueHasInvalidStructure(fromClause, value));
            break;
        case ((0, helper_service_1.isEntitiesQuery)(query)):
            errorMessages.push(checkIfSelectIsEmpty(selectClause), checkIfEntitiesOrConceptsSelectHasInvalidStructure(selectClause, key, value), checkIfSelectKeyHasInvalidStructure(fromClause, key), checkIfSelectValueHasInvalidStructure(fromClause, value));
            break;
        case ((0, helper_service_1.isConceptsQuery)(query)):
            errorMessages.push(checkIfSelectIsEmpty(selectClause), checkIfEntitiesOrConceptsSelectHasInvalidStructure(selectClause, key, value), checkIfSelectKeyHasInvalidStructure(fromClause, key), checkIfSelectValueHasInvalidStructure(fromClause, value));
            break;
        case ((0, helper_service_1.isDatapointsQuery)(query)):
            errorMessages.push(checkIfSelectIsEmpty(selectClause), checkIfSelectHasInvalidStructure(selectClause, key, value), checkIfDatapointsSelectKeyHasInvalidStructure(fromClause, key), checkIfDatapointsSelectKeyHasDuplicates(fromClause, key), checkIfDatapointsSelectValueHasInvalidStructure(fromClause, value));
            break;
        default:
            errorMessages.push(checkIfSelectIsEmpty(selectClause));
            break;
    }
    return (0, compact_1.default)(errorMessages);
}
function validateWhereStructure(query, options) {
    const errorMessages = [];
    const joinClause = (0, get_1.default)(query, 'join', null);
    const whereClause = (0, get_1.default)(query, 'where', null);
    const whereOperators = getWhereOperators(whereClause);
    errorMessages.push(checkIfWhereHasInvalidStructure(whereClause, getJoinIDPathIfExists(options)), checkIfWhereHasUnknownOperators(joinClause, whereOperators, getJoinIDPathIfExists(options)));
    return (0, compact_1.default)(errorMessages);
}
function validateLanguageStructure(query, options) {
    const errorMessages = [];
    const languageClause = (0, get_1.default)(query, 'language', null);
    switch (true) {
        case ((0, helper_service_1.isSchemaQuery)(query)):
            errorMessages.push(checkIfSchemaLanguageIsPresent(query));
            break;
        case ((0, helper_service_1.isEntitiesQuery)(query)):
        case ((0, helper_service_1.isConceptsQuery)(query)):
        case ((0, helper_service_1.isDatapointsQuery)(query)):
        default:
            errorMessages.push(checkIfLanguageHasInvalidStructure(languageClause));
            break;
    }
    return (0, compact_1.default)(errorMessages);
}
function validateJoinStructure(query, options) {
    const errorMessages = [];
    const joinClause = (0, get_1.default)(query, 'join', null);
    switch (true) {
        case ((0, helper_service_1.isSchemaQuery)(query)):
        case ((0, helper_service_1.isConceptsQuery)(query)):
            errorMessages.push(checkIfSchemaJoinIsPresent(query));
            break;
        case ((0, helper_service_1.isEntitiesQuery)(query)):
        case ((0, helper_service_1.isDatapointsQuery)(query)):
        default:
            errorMessages.push(checkIfJoinHasInvalidStructure(joinClause), ...(0, map_1.default)(joinClause, (item, joinID) => checkIfJoinKeyHasInvalidStructure(item, getJoinIDPathIfExists({ joinID }))));
            break;
    }
    return (0, compact_1.default)(errorMessages);
}
function validateOrderByStructure(query, options) {
    const errorMessages = [];
    const orderByClause = (0, get_1.default)(query, 'order_by', null);
    errorMessages.push(checkIfOrderByHasInvalidStructure(orderByClause));
    return (0, compact_1.default)(errorMessages);
}
function flatMapWrapper(array, iteratee) {
    return (0, flatMap_1.default)(array, iteratee);
}
function validateSubqueries(query, options) {
    return flatMapWrapper(query.join, async (join, joinID) => {
        return await validateQueryStructure({
            select: { key: [join.key] },
            where: join.where,
            from: query.from === 'entities' ? 'concepts' : 'entities',
            dataset: query.dataset,
            branch: query.branch,
            commit: query.commit
        }, Object.assign({ joinID }, (0, cloneDeep_1.default)(options)));
    });
}
function checkIfSelectIsEmpty(selectClause) {
    if ((0, isNil_1.default)(selectClause)) {
        return `'select' clause couldn't be empty`;
    }
}
function checkIfSelectHasInvalidStructure(selectClause, key, value) {
    if (!(0, isObject_1.default)(selectClause) || !(0, isArray_1.default)(key) || !(0, isArray_1.default)(value)) {
        return `'select' clause must have next structure: { key: [...], value: [...] }`;
    }
}
function checkIfJoinHasInvalidStructure(joinClause) {
    if (!(0, isNil_1.default)(joinClause) && !isStrictObject(joinClause)) {
        return `'join' clause must be object only`;
    }
}
function checkIfLanguageHasInvalidStructure(languageClause) {
    if (!(0, isNil_1.default)(languageClause) && !(0, isString_1.default)(languageClause)) {
        return `'language' clause must be string only`;
    }
}
function checkIfJoinKeyHasInvalidStructure(joinClause, joinPath) {
    if (!(0, isNil_1.default)(joinClause.key) && !(0, isString_1.default)(joinClause.key)) {
        return `'${joinPath}key' clause must be string only`;
    }
}
function checkIfWhereHasInvalidStructure(whereClause, joinPath) {
    if (!(0, isNil_1.default)(whereClause) && !isStrictObject(whereClause)) {
        return `'${joinPath}where' clause must be object only`;
    }
}
function checkIfWhereHasUnknownOperators(joinClause, operators, joinPath) {
    const notAllowedOperators = (0, filter_1.default)(operators, (operator) => !isAllowedOperator(joinClause, operator)).map((operator) => operator.name);
    const allowedOperatorsByDataset = [...helper_service_1.AVAILABLE_QUERY_OPERATORS.values(), ...(0, keys_1.default)(joinClause)];
    if (!(0, isEmpty_1.default)(notAllowedOperators)) {
        return `'${joinPath}where' clause has unknown operator(s) '${notAllowedOperators.join(', ')}', replace it with allowed operators: ${allowedOperatorsByDataset.join(', ')}`;
    }
}
function checkIfOrderByHasInvalidStructure(orderByClause) {
    if (!(0, isNil_1.default)(orderByClause) && !(0, isString_1.default)(orderByClause) && !isArrayOfStrings(orderByClause) && !isArrayOfSpecialItems(orderByClause, isOrderBySubclause)) {
        return `'order_by' clause must be string or array of strings || objects only`;
    }
}
function isStrictObject(clause) {
    return (0, isObject_1.default)(clause) && !(0, isArray_1.default)(clause);
}
function isArrayOfStrings(clause) {
    return (0, isArray_1.default)(clause) && (0, every_1.default)(clause, isString_1.default);
}
function isOrderBySubclause(subclause) {
    return (0, isString_1.default)(subclause) || (isStrictObject(subclause) && (0, size_1.default)(subclause) === 1 && helper_service_1.AVAILABLE_ORDER_BY_CLAUSE_VALUES.has((0, first_1.default)((0, values_1.default)(subclause))));
}
function isArrayOfSpecialItems(clause, isSpecialItem) {
    return (0, isArray_1.default)(clause) && (0, every_1.default)(clause, isSpecialItem);
}
function isAllowedOperator(joinClause, operator) {
    return isMongoLikeOperator(operator) || isJoinOperator(joinClause, operator);
}
function isMongoLikeOperator(operator) {
    return !operator.isLeaf && helper_service_1.AVAILABLE_QUERY_OPERATORS.has(operator.name);
}
function isJoinOperator(joinClause, operator) {
    return operator.isLeaf && (0, startsWith_1.default)(operator.name, '$') && (0, has_1.default)(joinClause, operator.name);
}
function getDuplicates(array) {
    return (0, filter_1.default)(array, (value, index, iteratee) => (0, includes_1.default)(iteratee, value, index + 1));
}
function getJoinIDPathIfExists(options) {
    return (0, get_1.default)(options, 'joinID', false) ? `join.${options.joinID}.` : '';
}
function getWhereOperators(whereClause) {
    const operators = [];
    for (const field in whereClause) {
        if ((0, startsWith_1.default)(field, '$')) {
            operators.push({ name: field, isLeaf: false });
        }
        if (isPrimitive(whereClause[field])) {
            if ((0, startsWith_1.default)(whereClause[field], '$')) {
                operators.push({ name: whereClause[field], isLeaf: true });
            }
        }
        else {
            operators.push(...getWhereOperators(whereClause[field]));
        }
    }
    return operators;
}
function checkIfDatapointsSelectKeyHasInvalidStructure(fromClause, key) {
    if ((0, size_1.default)(key) < 2) {
        return `'select.key' clause for '${fromClause}' queries must have at least 2 items`;
    }
}
function checkIfDatapointsSelectKeyHasDuplicates(fromClause, key) {
    const duplicates = getDuplicates(key);
    if ((0, size_1.default)(duplicates) > 0) {
        return `'select.key' clause for '${fromClause}' queries contains duplicates: ${(0, uniq_1.default)(duplicates).join(',')}`;
    }
}
function checkIfDatapointsSelectValueHasInvalidStructure(fromClause, value) {
    if ((0, size_1.default)(value) < 1) {
        return `'select.value' clause for '${fromClause}' queries must have at least 1 item`;
    }
}
function checkIfSchemasSelectKeyHasInvalidStructure(fromClause, key) {
    if (!(0, isArray_1.default)(key) || (0, size_1.default)(key) !== 2) {
        return `'select.key' clause for '${fromClause}' queries must have exactly 2 items: 'key', 'value'`;
    }
}
function checkIfSelectValueHasInvalidStructure(fromClause, value) {
    if (!(0, isArray_1.default)(value) && !(0, isNil_1.default)(value)) {
        return `'select.value' clause for '${fromClause}' queries should be array of strings or empty`;
    }
}
function checkIfSchemaJoinIsPresent(query) {
    if ((0, has_1.default)(query, 'join')) {
        return `'join' clause for '${query.from}' queries shouldn't be present in query`;
    }
}
function checkIfSchemaLanguageIsPresent(query) {
    if ((0, has_1.default)(query, 'language')) {
        return `'language' clause for '*.schema' queries shouldn't be present in query`;
    }
}
function checkIfEntitiesOrConceptsSelectHasInvalidStructure(selectClause, key, value) {
    if (!(0, isObject_1.default)(selectClause) || !(0, isArray_1.default)(key)) {
        return `'select' clause must have next structure: { key: [...], value: [...] }`;
    }
}
function checkIfSelectKeyHasInvalidStructure(fromClause, key) {
    if (!(0, isArray_1.default)(key) || (0, size_1.default)(key) !== 1) {
        return `'select.key' clause for '${fromClause}' queries must have only 1 item`;
    }
}
//# sourceMappingURL=structure.service.js.map