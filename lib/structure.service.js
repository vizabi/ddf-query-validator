"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const isEmpty = require("lodash.isempty");
const isNil = require("lodash.isnil");
const isObject = require("lodash.isobject");
const isArray = require("lodash.isarray");
const size = require("lodash.size");
const cloneDeep = require("lodash.clonedeep");
const values = require("lodash.values");
const keys = require("lodash.keys");
const map = require("lodash.map");
const flatMap = require("lodash.flatmap");
const first = require("lodash.first");
const filter = require("lodash.filter");
const startsWith = require("lodash.startswith");
const get = require("lodash.get");
const has = require("lodash.has");
const every = require("lodash.every");
const compact = require("lodash.compact");
const isString = require("lodash.isstring");
const includes = require("lodash.includes");
const uniq = require("lodash.uniq");
const helper_service_1 = require("./helper.service");
const util_1 = require("util");
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
        const isQueryValid = isEmpty(validationResult);
        if (!isQueryValid) {
            return reject(`Too many query structure errors: \n* ${validationResult.join('\n* ')}`);
        }
        return resolve();
    });
}
exports.validateQueryStructure = validateQueryStructure;
function getVersion() {
    return process.env.npm_package_version;
}
exports.getVersion = getVersion;
function validateDatasetStructure(query, options) {
    const errorMessages = [];
    const datasetClause = get(query, 'dataset');
    const branchClause = get(query, 'branch');
    const commitClause = get(query, 'commit');
    if (!isNil(datasetClause) && !isString(datasetClause)) {
        errorMessages.push(`'dataset' clause must be string only`);
    }
    if (!isNil(branchClause) && !isString(branchClause)) {
        errorMessages.push(`'branch' clause must be string only`);
    }
    if (!isNil(commitClause) && !isString(commitClause)) {
        errorMessages.push(`'commit' clause must be string only`);
    }
    return errorMessages;
}
function validateFromStructure(query, options) {
    const errorMessages = [];
    const clause = get(query, 'from', null);
    if (isNil(clause)) {
        errorMessages.push(`'from' clause couldn't be empty`);
    }
    if (!isString(clause)) {
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
    const selectClause = get(query, 'select', null);
    const fromClause = get(query, 'from', null);
    const key = get(selectClause, 'key');
    const value = get(selectClause, 'value');
    switch (true) {
        case (helper_service_1.isSchemaQuery(query)):
            errorMessages.push(checkIfSelectIsEmpty(selectClause), checkIfSchemasSelectKeyHasInvalidStructure(fromClause, key), checkIfSelectValueHasInvalidStructure(fromClause, value));
            break;
        case (helper_service_1.isEntitiesQuery(query)):
            errorMessages.push(checkIfSelectIsEmpty(selectClause), checkIfEntitiesOrConceptsSelectHasInvalidStructure(selectClause, key, value), checkIfSelectKeyHasInvalidStructure(fromClause, key), checkIfSelectValueHasInvalidStructure(fromClause, value));
            break;
        case (helper_service_1.isConceptsQuery(query)):
            errorMessages.push(checkIfSelectIsEmpty(selectClause), checkIfEntitiesOrConceptsSelectHasInvalidStructure(selectClause, key, value), checkIfSelectKeyHasInvalidStructure(fromClause, key), checkIfSelectValueHasInvalidStructure(fromClause, value));
            break;
        case (helper_service_1.isDatapointsQuery(query)):
            errorMessages.push(checkIfSelectIsEmpty(selectClause), checkIfSelectHasInvalidStructure(selectClause, key, value), checkIfDatapointsSelectKeyHasInvalidStructure(fromClause, key), checkIfDatapointsSelectKeyHasDuplicates(fromClause, key), checkIfDatapointsSelectValueHasInvalidStructure(fromClause, value));
            break;
        default:
            errorMessages.push(checkIfSelectIsEmpty(selectClause));
            break;
    }
    return compact(errorMessages);
}
function validateWhereStructure(query, options) {
    const errorMessages = [];
    const joinClause = get(query, 'join', null);
    const whereClause = get(query, 'where', null);
    const whereOperators = getWhereOperators(whereClause);
    errorMessages.push(checkIfWhereHasInvalidStructure(whereClause, getJoinIDPathIfExists(options)), checkIfWhereHasUnknownOperators(joinClause, whereOperators, getJoinIDPathIfExists(options)));
    return compact(errorMessages);
}
function validateLanguageStructure(query, options) {
    const errorMessages = [];
    const languageClause = get(query, 'language', null);
    switch (true) {
        case (helper_service_1.isSchemaQuery(query)):
            errorMessages.push(checkIfSchemaLanguageIsPresent(query));
            break;
        case (helper_service_1.isEntitiesQuery(query)):
        case (helper_service_1.isConceptsQuery(query)):
        case (helper_service_1.isDatapointsQuery(query)):
        default:
            errorMessages.push(checkIfLanguageHasInvalidStructure(languageClause));
            break;
    }
    return compact(errorMessages);
}
function validateJoinStructure(query, options) {
    const errorMessages = [];
    const joinClause = get(query, 'join', null);
    switch (true) {
        case (helper_service_1.isSchemaQuery(query)):
        case (helper_service_1.isConceptsQuery(query)):
            errorMessages.push(checkIfSchemaJoinIsPresent(query));
            break;
        case (helper_service_1.isEntitiesQuery(query)):
        case (helper_service_1.isDatapointsQuery(query)):
        default:
            errorMessages.push(checkIfJoinHasInvalidStructure(joinClause), ...map(joinClause, (item, joinID) => checkIfJoinKeyHasInvalidStructure(item, getJoinIDPathIfExists({ joinID }))));
            break;
    }
    return compact(errorMessages);
}
function validateOrderByStructure(query, options) {
    const errorMessages = [];
    const orderByClause = get(query, 'order_by', null);
    errorMessages.push(checkIfOrderByHasInvalidStructure(orderByClause));
    return compact(errorMessages);
}
function validateSubqueries(query, options) {
    return flatMap(query.join, async (join, joinID) => {
        return await validateQueryStructure({
            select: { key: [join.key] },
            where: join.where,
            from: query.from === 'entities' ? 'concepts' : 'entities',
            dataset: query.dataset,
            branch: query.branch,
            commit: query.commit
        }, Object.assign({ joinID }, cloneDeep(options)));
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
function checkIfJoinHasInvalidStructure(joinClause) {
    if (!isNil(joinClause) && !isStrictObject(joinClause)) {
        return `'join' clause must be object only`;
    }
}
function checkIfLanguageHasInvalidStructure(languageClause) {
    if (!isNil(languageClause) && !isString(languageClause)) {
        return `'language' clause must be string only`;
    }
}
function checkIfJoinKeyHasInvalidStructure(joinClause, joinPath) {
    if (!isNil(joinClause.key) && !isString(joinClause.key)) {
        return `'${joinPath}key' clause must be string only`;
    }
}
function checkIfWhereHasInvalidStructure(whereClause, joinPath) {
    if (!isNil(whereClause) && !isStrictObject(whereClause)) {
        return `'${joinPath}where' clause must be object only`;
    }
}
function checkIfWhereHasUnknownOperators(joinClause, operators, joinPath) {
    const notAllowedOperators = filter(operators, (operator) => !isAllowedOperator(joinClause, operator)).map((operator) => operator.name);
    const allowedOperatorsByDataset = [...helper_service_1.AVAILABLE_QUERY_OPERATORS.values(), ...keys(joinClause)];
    if (!isEmpty(notAllowedOperators)) {
        return `'${joinPath}where' clause has unknown operator(s) '${notAllowedOperators.join(', ')}', replace it with allowed operators: ${allowedOperatorsByDataset.join(', ')}`;
    }
}
function checkIfOrderByHasInvalidStructure(orderByClause) {
    if (!isNil(orderByClause) && !isString(orderByClause) && !isArrayOfStrings(orderByClause) && !isArrayOfSpecialItems(orderByClause, isOrderBySubclause)) {
        return `'order_by' clause must be string or array of strings || objects only`;
    }
}
function isStrictObject(clause) {
    return isObject(clause) && !isArray(clause);
}
function isArrayOfStrings(clause) {
    return isArray(clause) && every(clause, isString);
}
function isOrderBySubclause(subclause) {
    return isString(subclause) || (isStrictObject(subclause) && size(subclause) === 1 && helper_service_1.AVAILABLE_ORDER_BY_CLAUSE_VALUES.has(first(values(subclause))));
}
function isArrayOfSpecialItems(clause, isSpecialItem) {
    return isArray(clause) && every(clause, isSpecialItem);
}
function isAllowedOperator(joinClause, operator) {
    return isMongoLikeOperator(operator) || isJoinOperator(joinClause, operator);
}
function isMongoLikeOperator(operator) {
    return !operator.isLeaf && helper_service_1.AVAILABLE_QUERY_OPERATORS.has(operator.name);
}
function isJoinOperator(joinClause, operator) {
    return operator.isLeaf && startsWith(operator.name, '$') && has(joinClause, operator.name);
}
function getDuplicates(array) {
    return filter(array, (value, index, iteratee) => includes(iteratee, value, index + 1));
}
function getJoinIDPathIfExists(options) {
    return get(options, 'joinID', false) ? `join.${options.joinID}.` : '';
}
function getWhereOperators(whereClause) {
    const operators = [];
    for (const field in whereClause) {
        if (startsWith(field, '$')) {
            operators.push({ name: field, isLeaf: false });
        }
        if (util_1.isPrimitive(whereClause[field])) {
            if (startsWith(whereClause[field], '$')) {
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
    if (size(key) < 2) {
        return `'select.key' clause for '${fromClause}' queries must have at least 2 items`;
    }
}
function checkIfDatapointsSelectKeyHasDuplicates(fromClause, key) {
    const duplicates = getDuplicates(key);
    if (size(duplicates) > 0) {
        return `'select.key' clause for '${fromClause}' queries contains duplicates: ${uniq(duplicates).join(',')}`;
    }
}
function checkIfDatapointsSelectValueHasInvalidStructure(fromClause, value) {
    if (size(value) < 1) {
        return `'select.value' clause for '${fromClause}' queries must have at least 1 item`;
    }
}
function checkIfSchemasSelectKeyHasInvalidStructure(fromClause, key) {
    if (!isArray(key) || size(key) !== 2) {
        return `'select.key' clause for '${fromClause}' queries must have exactly 2 items: 'key', 'value'`;
    }
}
function checkIfSelectValueHasInvalidStructure(fromClause, value) {
    if (!isArray(value) && !isNil(value)) {
        return `'select.value' clause for '${fromClause}' queries should be array of strings or empty`;
    }
}
function checkIfSchemaJoinIsPresent(query) {
    if (has(query, 'join')) {
        return `'join' clause for '${query.from}' queries shouldn't be present in query`;
    }
}
function checkIfSchemaLanguageIsPresent(query) {
    if (has(query, 'language')) {
        return `'language' clause for '*.schema' queries shouldn't be present in query`;
    }
}
function checkIfEntitiesOrConceptsSelectHasInvalidStructure(selectClause, key, value) {
    if (!isObject(selectClause) || !isArray(key)) {
        return `'select' clause must have next structure: { key: [...], value: [...] }`;
    }
}
function checkIfSelectKeyHasInvalidStructure(fromClause, key) {
    if (!isArray(key) || size(key) !== 1) {
        return `'select.key' clause for '${fromClause}' queries must have only 1 item`;
    }
}
//# sourceMappingURL=structure.service.js.map