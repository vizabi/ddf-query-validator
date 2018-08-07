export interface IReader {
  recordTransformer: Function;
  setRecordTransformer(recordTransformer: Function);
  readText(filePath: string, onFileRead: Function);
}

export enum QueryFeature {
  WhereClauseBasedOnConjunction = 'WhereClauseBasedOnConjunction',
  ConjunctionPartFromWhereClauseCorrespondsToJoin = 'ConjunctionPartFromWhereClauseCorrespondsToJoin'
}

export interface IQuery {
  from: string;
  select: { key: string[], value: string[] };
  where?;
  join?;
  order_by?: string[];
}

// export interface IQueryFeatureDetector {
//   (query: IQuery, conceptsLookup?): QueryFeature | null;
// }

export type IQueryFeatureDetector = (query: IQuery, conceptsLookup?) => QueryFeature | null;
