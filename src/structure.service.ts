import * as isEmpty from 'lodash.isempty';
import * as isNil from 'lodash.isnil';
import * as isObject from 'lodash.isobject';
import * as isArray from 'lodash.isarray';
import * as size from 'lodash.size';
import * as cloneDeep from 'lodash.clonedeep';
import * as values from 'lodash.values';
import * as keys from 'lodash.keys';
import * as map from 'lodash.map';
import * as flatMap from 'lodash.flatmap';
import * as first from 'lodash.first';
import * as filter from 'lodash.filter';
import * as startsWith from 'lodash.startswith';
import * as get from 'lodash.get';
import * as has from 'lodash.has';
import * as every from 'lodash.every';
import * as compact from 'lodash.compact';
import * as isString from 'lodash.isstring';
import * as includes from 'lodash.includes';
import * as uniq from 'lodash.uniq';
import {
  AVAILABLE_FROM_CLAUSE_VALUES,
  AVAILABLE_ORDER_BY_CLAUSE_VALUES,
  AVAILABLE_QUERY_OPERATORS,
  isConceptsQuery,
  isDatapointsQuery,
  isEntitiesQuery,
  isSchemaQuery,
} from './helper.service';
import { isPrimitive } from 'util';

export function validateQueryStructure (query, options = {}): Promise<string | void> {
  return new Promise((resolve, reject) => {
    const validationResult = [
      ...validateDatasetStructure(query, options),
      ...validateFromStructure(query, options),
      ...validateSelectStructure(query, options),
      ...validateWhereStructure(query, options),
      ...validateLanguageStructure(query, options),
      ...validateJoinStructure(query, options),
      ...validateOrderByStructure(query, options),
      // ...validateSubqueries(query, options)
    ];

    const isQueryValid = isEmpty(validationResult);

    if (!isQueryValid) {
      return reject(`Too many query structure errors: \n* ${validationResult.join('\n* ')}`);
    }

    return resolve();
  });
}

export function getVersion() {
  return process.env.npm_package_version;
}

function validateDatasetStructure(query, options): string[] {
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

function validateFromStructure (query: any, options): string[] {
  const errorMessages = [];
  const clause = get(query, 'from', null);

  if (isNil(clause)) {
    errorMessages.push(`'from' clause couldn't be empty`);
  }

  if (!isString(clause)) {
    errorMessages.push(`'from' clause must be string only`);
  }

  if (!AVAILABLE_FROM_CLAUSE_VALUES.has(clause)) {
    const listAvaliableValues = [ ...AVAILABLE_FROM_CLAUSE_VALUES ];
    errorMessages.push(`'from' clause must be one of the list: ${listAvaliableValues.join(', ')}`);
  }

  return errorMessages;
}

function validateSelectStructure (query, options): string[] {
  const errorMessages = [];
  const selectClause = get(query, 'select', null);
  const fromClause = get(query, 'from', null);
  const key = get(selectClause, 'key');
  const value = get(selectClause, 'value');

  switch (true) {
    case (isSchemaQuery(query)):
      errorMessages.push(
        checkIfSelectIsEmpty(selectClause),
        checkIfSchemasSelectKeyHasInvalidStructure(fromClause, key),
        checkIfSelectValueHasInvalidStructure(fromClause, value),
      );
      break;
    case (isEntitiesQuery(query)):
      errorMessages.push(
        checkIfSelectIsEmpty(selectClause),
        checkIfEntitiesOrConceptsSelectHasInvalidStructure(selectClause, key, value),
        checkIfSelectKeyHasInvalidStructure(fromClause, key),
        checkIfSelectValueHasInvalidStructure(fromClause, value),
      );
      break;
    case (isConceptsQuery(query)):
      errorMessages.push(
        checkIfSelectIsEmpty(selectClause),
        checkIfEntitiesOrConceptsSelectHasInvalidStructure(selectClause, key, value),
        checkIfSelectKeyHasInvalidStructure(fromClause, key),
        checkIfSelectValueHasInvalidStructure(fromClause, value),
      );
      break;
    case (isDatapointsQuery(query)):
      errorMessages.push(
        checkIfSelectIsEmpty(selectClause),
        checkIfSelectHasInvalidStructure(selectClause, key, value),
        checkIfDatapointsSelectKeyHasInvalidStructure(fromClause, key),
        checkIfDatapointsSelectKeyHasDuplicates(fromClause, key),
        checkIfDatapointsSelectValueHasInvalidStructure(fromClause, value),
      );
      break;
    default:
      errorMessages.push(
        checkIfSelectIsEmpty(selectClause),
      );
      break;
  }

  return compact(errorMessages);
}

function validateWhereStructure (query, options): string[] {
  const errorMessages = [];
  const joinClause = get(query, 'join', null);
  const whereClause = get(query, 'where', null);
  const whereOperators = getWhereOperators(whereClause);

  errorMessages.push(
    checkIfWhereHasInvalidStructure(whereClause, getJoinIDPathIfExists(options)),
    checkIfWhereHasUnknownOperators(joinClause, whereOperators, getJoinIDPathIfExists(options)),
  );

  return compact(errorMessages);
}

function validateLanguageStructure (query, options): string[] {
  const errorMessages = [];
  const languageClause = get(query, 'language', null);

  switch (true) {
    case (isSchemaQuery(query)):
      errorMessages.push(
        checkIfSchemaLanguageIsPresent(query),
      );
      break;
    case (isEntitiesQuery(query)):
    case (isConceptsQuery(query)):
    case (isDatapointsQuery(query)):
    default:
      errorMessages.push(
        checkIfLanguageHasInvalidStructure(languageClause),
      );
      break;
  }

  return compact(errorMessages);
}

function validateJoinStructure (query, options): string[] {
  const errorMessages = [];
  const joinClause = get(query, 'join', null);

  switch (true) {
    case (isSchemaQuery(query)):
    case (isConceptsQuery(query)):
      errorMessages.push(
        checkIfSchemaJoinIsPresent(query),
      );
      break;
    case (isEntitiesQuery(query)):
    case (isDatapointsQuery(query)):
    default:
      errorMessages.push(
        checkIfJoinHasInvalidStructure(joinClause),
        ...map(joinClause, (item, joinID) => checkIfJoinKeyHasInvalidStructure(item, getJoinIDPathIfExists({joinID})))
      );
      break;
  }

  return compact(errorMessages);
}

function validateOrderByStructure (query, options): string[] {
  const errorMessages = [];
  const orderByClause = get(query, 'order_by', null);

  errorMessages.push(
    checkIfOrderByHasInvalidStructure(orderByClause),
  );

  return compact(errorMessages);
}

function validateSubqueries (query, options): string[] {
  return flatMap(query.join, async (join: {key: string, where: object}, joinID: string) => {
    return await validateQueryStructure({
      select: {key: [join.key]},
      where: join.where,
      from: query.from === 'entities' ? 'concepts' : 'entities',
      dataset: query.dataset,
      branch: query.branch,
      commit: query.commit
    }, Object.assign({joinID}, cloneDeep(options)));
  });
}

// Common structure errors
function checkIfSelectIsEmpty (selectClause): string | void {
  if (isNil(selectClause)) {
    return `'select' clause couldn't be empty`;
  }
}

function checkIfSelectHasInvalidStructure (selectClause, key, value): string | void {
  if (!isObject(selectClause) || !isArray(key) || !isArray(value)) {
    return `'select' clause must have next structure: { key: [...], value: [...] }`;
  }
}

function checkIfJoinHasInvalidStructure (joinClause): string | void {
  if (!isNil(joinClause) && !isStrictObject(joinClause)) {
    return `'join' clause must be object only`;
  }
}

function checkIfLanguageHasInvalidStructure (languageClause): string | void {
  if (!isNil(languageClause) && !isString(languageClause)) {
    return `'language' clause must be string only`;
  }
}

function checkIfJoinKeyHasInvalidStructure (joinClause, joinPath: string): string | void {
  if (!isNil(joinClause.key) && !isString(joinClause.key)) {
    return `'${joinPath}key' clause must be string only`;
  }
}

function checkIfWhereHasInvalidStructure (whereClause, joinPath: string): string | void {
  if (!isNil(whereClause) && !isStrictObject(whereClause)) {
    return `'${joinPath}where' clause must be object only`;
  }
}

function checkIfWhereHasUnknownOperators (joinClause, operators, joinPath: string): string | void {
  const notAllowedOperators = filter(operators, (operator) => !isAllowedOperator(joinClause, operator)).map((operator) => operator.name);
  const allowedOperatorsByDataset = [ ...AVAILABLE_QUERY_OPERATORS.values(), ...keys(joinClause) ];

  if (!isEmpty(notAllowedOperators)) {
    return `'${joinPath}where' clause has unknown operator(s) '${notAllowedOperators.join(', ')}', replace it with allowed operators: ${allowedOperatorsByDataset.join(', ')}`;
  }

}

function checkIfOrderByHasInvalidStructure (orderByClause): string | void {
  if (!isNil(orderByClause) && !isString(orderByClause) && !isArrayOfStrings(orderByClause) && !isArrayOfSpecialItems(orderByClause, isOrderBySubclause)) {
    return `'order_by' clause must be string or array of strings || objects only`;
  }
}

function isStrictObject (clause): boolean {
  return isObject(clause) && !isArray(clause);
}

function isArrayOfStrings (clause): boolean {
  return isArray(clause) && every(clause, isString);
}

function isOrderBySubclause (subclause) {
  return isString(subclause) || (isStrictObject(subclause) && size(subclause) === 1 && AVAILABLE_ORDER_BY_CLAUSE_VALUES.has(first(values(subclause))));
}

function isArrayOfSpecialItems (clause, isSpecialItem): boolean {
  return isArray(clause) && every(clause, isSpecialItem);
}

function isAllowedOperator (joinClause, operator) {
  return isMongoLikeOperator(operator) || isJoinOperator(joinClause, operator);
}

function isMongoLikeOperator (operator) {
  return !operator.isLeaf && AVAILABLE_QUERY_OPERATORS.has(operator.name);
}

function isJoinOperator (joinClause, operator) {
  return operator.isLeaf && startsWith(operator.name, '$') && has(joinClause, operator.name);
}

function getDuplicates (array: string[]): string[] {
  return filter(array, (value, index: number, iteratee) => includes(iteratee, value, index + 1));
}

function getJoinIDPathIfExists(options) {
  return get(options, 'joinID', false) ? `join.${options.joinID}.` : '';
}

function getWhereOperators (whereClause): string[] {
  const operators = [];

  for (const field in whereClause) {
    // no support for deeper object structures (mongo style)

    if (startsWith(field, '$')) {
      operators.push({ name: field, isLeaf: false });
    }

    if (isPrimitive(whereClause[ field ])) {
      if (startsWith(whereClause[ field ], '$')) {
        operators.push({ name: whereClause[ field ], isLeaf: true });
      }
    } else {
      operators.push(...getWhereOperators(whereClause[ field ]));
    }
  }

  return operators;
}

// * specific datapoints select errors
function checkIfDatapointsSelectKeyHasInvalidStructure (fromClause, key): string | void {
  if (size(key) < 2) {
    return `'select.key' clause for '${fromClause}' queries must have at least 2 items`;
  }
}

function checkIfDatapointsSelectKeyHasDuplicates (fromClause, key): string | void {
  const duplicates = getDuplicates(key);

  if (size(duplicates) > 0) {
    return `'select.key' clause for '${fromClause}' queries contains duplicates: ${uniq(duplicates).join(',')}`;
  }
}

function checkIfDatapointsSelectValueHasInvalidStructure (fromClause, value): string | void {
  if (size(value) < 1) {
    return `'select.value' clause for '${fromClause}' queries must have at least 1 item`;
  }
}

// * specific schemas select errors
function checkIfSchemasSelectKeyHasInvalidStructure (fromClause, key): string | void {
  if (!isArray(key) || size(key) !== 2) {
    return `'select.key' clause for '${fromClause}' queries must have exactly 2 items: 'key', 'value'`;
  }
}

function checkIfSelectValueHasInvalidStructure (fromClause, value): string | void {
  if (!isArray(value) && !isNil(value)) {
    return `'select.value' clause for '${fromClause}' queries should be array of strings or empty`;
  }
}

function checkIfSchemaJoinIsPresent (query): string | void {
  if (has(query, 'join')) {
    return `'join' clause for '${query.from}' queries shouldn't be present in query`;
  }
}

function checkIfSchemaLanguageIsPresent (query): string | void {
  if (has(query, 'language')) {
    return `'language' clause for '*.schema' queries shouldn't be present in query`;
  }
}

// * specific concepts/entities select errors
function checkIfEntitiesOrConceptsSelectHasInvalidStructure (selectClause, key, value): string | void {
  if (!isObject(selectClause) || !isArray(key)) {
    return `'select' clause must have next structure: { key: [...], value: [...] }`;
  }
}

function checkIfSelectKeyHasInvalidStructure (fromClause, key): string | void {
  if (!isArray(key) || size(key) !== 1) {
    return `'select.key' clause for '${fromClause}' queries must have only 1 item`;
  }
}
