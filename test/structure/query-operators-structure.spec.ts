import * as chai from 'chai';
import * as validator from '../../src/structure.service';
import { expectPromiseRejection, whereClauseBooleanOperatorMustBeArray, joinWhereClauseBooleanOperatorMustBeArray } from '../common';

const expect = chai.expect;

describe('Query operators structure errors in query', () => {

  describe('$nor operator', () => {
    it('should reject when $nor is an object instead of an array', async () => {
      const query = {
        from: 'datapoints',
        select: { key: ['geo', 'time'], value: ['pop'] },
        where: { $nor: { geo: { $in: ['afg'] } } }
      };

      await expectPromiseRejection({
        promiseFunction: validator.validateQueryStructure,
        args: [query],
        expectedErrors: [whereClauseBooleanOperatorMustBeArray('nor')]
      });
    });

    it('should accept when $nor is an array', async () => {
      const query = {
        from: 'datapoints',
        select: { key: ['geo', 'time'], value: ['pop'] },
        where: { $nor: [{ geo: 'afg' }] }
      };

      await validator.validateQueryStructure(query);
      expect(true).to.be.ok;
    });
  });

  describe('$and operator', () => {
    it('should reject when $and is an object instead of an array', async () => {
      const query = {
        from: 'datapoints',
        select: { key: ['geo', 'time'], value: ['pop'] },
        where: { $and: { geo: 'swe' } }
      };

      await expectPromiseRejection({
        promiseFunction: validator.validateQueryStructure,
        args: [query],
        expectedErrors: [whereClauseBooleanOperatorMustBeArray('and')]
      });
    });
  });

  describe('$or operator', () => {
    it('should reject when $or is an object instead of an array', async () => {
      const query = {
        from: 'datapoints',
        select: { key: ['geo', 'time'], value: ['pop'] },
        where: { $or: { geo: 'swe' } }
      };

      await expectPromiseRejection({
        promiseFunction: validator.validateQueryStructure,
        args: [query],
        expectedErrors: [whereClauseBooleanOperatorMustBeArray('or')]
      });
    });
  });

  it('should reject $nor inside nested $and when it is not an array', async () => {
    const query = {
      from: 'datapoints',
      select: { key: ['geo', 'time'], value: ['pop'] },
      where: { $and: [{ $nor: { geo: 'swe' } }] }
    };

    await expectPromiseRejection({
      promiseFunction: validator.validateQueryStructure,
      args: [query],
      expectedErrors: [whereClauseBooleanOperatorMustBeArray('nor')]
    });
  });

  describe('join sub-where boolean operator checks', () => {
    it('should reject when join.$geo.where.$nor is an object instead of an array', async () => {
      const query = {
        from: 'datapoints',
        select: { key: ['geo', 'time'], value: ['pop'] },
        where: { geo: '$geo' },
        join: {
          $geo: {
            key: 'geo',
            where: { $nor: { un_state: true } }
          }
        }
      };

      await expectPromiseRejection({
        promiseFunction: validator.validateQueryStructure,
        args: [query],
        expectedErrors: [joinWhereClauseBooleanOperatorMustBeArray('geo', 'nor')]
      });
    });

    it('should reject when join.$age.where.$and is an object instead of an array', async () => {
      const query = {
        from: 'datapoints',
        select: { key: ['geo', 'time'], value: ['pop'] },
        where: { age: '$age' },
        join: {
          $age: {
            key: 'age',
            where: { $and: { age: { $in: ['1', '2'] } } }
          }
        }
      };

      await expectPromiseRejection({
        promiseFunction: validator.validateQueryStructure,
        args: [query],
        expectedErrors: [joinWhereClauseBooleanOperatorMustBeArray('age', 'and')]
      });
    });

    it('should accept when join sub-where boolean operators are arrays', async () => {
      const query = {
        from: 'datapoints',
        select: { key: ['geo', 'time'], value: ['pop'] },
        where: { geo: '$geo' },
        join: {
          $geo: {
            key: 'geo',
            where: { $and: [{ un_state: true }, { geo: { $in: ['swe'] } }] }
          }
        }
      };

      await validator.validateQueryStructure(query);
      expect(true).to.be.ok;
    });
  });
});
