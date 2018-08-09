import * as keys from 'lodash.keys';
import * as isObject from 'lodash.isobject';
import * as head from 'lodash.head';
import { isDatapointsQuery } from './helper.service';
import { IQuery, IQueryFeatureDetector, QueryFeature } from './interfaces';

function isWhereClauseBasedOnConjunction(query: IQuery): QueryFeature | null {
  if (!isDatapointsQuery(query)) {
    return null;
  }

  if (keys(query.where).length === 1 && isObject(query.where) && query.where.$and) {
    return QueryFeature.WhereClauseBasedOnConjunction;
  }

  return null;
}

export const featureDetectors: IQueryFeatureDetector[] = [
  isWhereClauseBasedOnConjunction,
  (query: IQuery, conceptsLookup) => {
    if (!isWhereClauseBasedOnConjunction(query)) {
      return null;
    }

    for (const whereAndClauseDetail of query.where.$and) {
      const whereAndClauseDetailKeys = keys(whereAndClauseDetail);

      if (whereAndClauseDetailKeys.length === 1) {
        const whereAndClauseDetailKey = head(whereAndClauseDetailKeys);
        const whereAndClauseDetailValue = whereAndClauseDetail[whereAndClauseDetailKey];

        // something like this: {$and: [{country: '$country'}]}
        if (query.join && query.join[whereAndClauseDetailValue]) {
          const joinClausePart = query.join[whereAndClauseDetailValue];

          const joinClausePartWhere = joinClausePart.where;
          const joinClausePartWhereKey = head(keys(joinClausePartWhere));

          // something like following:
          // country from join.$country.key === {$and: [{country: '$country'}]} === "{country: {$in: ['afg']}}"
          // and keys length for "{country: {$in: ['afg']}}" === 1

          const keysAreEqualBetweenJoinWhereAndMainWhere =
            joinClausePart.key === whereAndClauseDetailKey && joinClausePart.key === joinClausePartWhereKey;

          if (keysAreEqualBetweenJoinWhereAndMainWhere && keys(joinClausePartWhere).length === 1) {
            const joinPartDetails = joinClausePartWhere[joinClausePartWhereKey];
            const keyConceptDescriptor = conceptsLookup.get(joinClausePart.key);

            if (keys(joinPartDetails).length === 1 && !!joinPartDetails.$in &&
              (keyConceptDescriptor.concept_type === 'entity_set' || keyConceptDescriptor.concept_type === 'entity_domain')) {
              // positive result is just HERE!
              return QueryFeature.ConjunctionPartFromWhereClauseCorrespondsToJoin;
            }
          }
        }
      }
    }

    return null;
  }
];
