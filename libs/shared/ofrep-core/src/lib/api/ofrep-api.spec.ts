import { server } from '../../test/mock-service-worker';
import { OFREPApi } from './ofrep-api';
import {
  BulkEvaluationFailureResponse,
  BulkEvaluationSuccessResponse,
  EvaluationFailureErrorCode,
  EvaluationFailureResponse,
  EvaluationSuccessReason,
  EvaluationSuccessResponse,
} from '../model';
import { EvaluationContext } from '@openfeature/core';
import {
  OFREPApiFetchError,
  OFREPApiTooManyRequestsError,
  OFREPApiUnauthorizedError,
  OFREPApiUnexpectedResponseError,
  OFREPForbiddenError,
} from './errors';

describe('OFREPApi', () => {
  let api: OFREPApi;

  beforeAll(() => server.listen());
  beforeEach(() => {
    api = new OFREPApi('https://localhost:8080');
  });
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  describe('postEvaluateFlags should', () => {
    it('throw OFREPApiFetchError on network error', async () => {
      await expect(() => api.postEvaluateFlags('my-flag', { context: { errors: { network: true } } })).rejects.toThrow(
        OFREPApiFetchError,
      );
    });

    it('throw OFREPApiUnexpectedResponseError on any error code without EvaluationFailureResponse body', async () => {
      await expect(() =>
        api.postEvaluateFlags('my-flag', { context: { errors: { generic400: true } } }),
      ).rejects.toThrow(OFREPApiUnexpectedResponseError);
    });

    it('throw OFREPForbiddenError on 401 response', async () => {
      await expect(() => api.postEvaluateFlags('my-flag', { context: { errors: { 401: true } } })).rejects.toThrow(
        OFREPApiUnauthorizedError,
      );
    });

    it('throw OFREPForbiddenError on 403 response', async () => {
      await expect(() => api.postEvaluateFlags('my-flag', { context: { errors: { 403: true } } })).rejects.toThrow(
        OFREPForbiddenError,
      );
    });

    it('throw OFREPApiTooManyRequestsError on 429 response', async () => {
      await expect(() => api.postEvaluateFlags('my-flag', { context: { errors: { 429: true } } })).rejects.toThrow(
        OFREPApiTooManyRequestsError,
      );
    });

    it('send empty request body if context is not given', async () => {
      const result = await api.postEvaluateFlags('my-flag');
      expect(result.httpStatus).toEqual(200);
    });

    it('send evaluation context in request body', async () => {
      const result = await api.postEvaluateFlags('context-in-metadata', {
        context: {
          targetingKey: 'user-1',
          key1: 'value1',
        },
      });

      if (result.httpStatus !== 200) {
        throw new Error('Received unexpected HTTP status');
      }

      expect(result.value.metadata).toEqual({
        context: {
          key1: 'value1',
          targetingKey: 'user-1',
        },
      } satisfies EvaluationContext);
    });

    it('return HTTP status in result', async () => {
      const result = await api.postEvaluateFlags('my-flag');
      expect(result.httpStatus).toEqual(200);
    });

    it('return EvaluationFailureResponse response as value on HTTP 400', async () => {
      const result = await api.postEvaluateFlags('my-flag', { context: { errors: { notFound: true } } });
      if (result.httpStatus !== 404) {
        throw new Error('Received unexpected HTTP status');
      }

      expect(result.value).toEqual({
        key: 'my-flag',
        errorCode: EvaluationFailureErrorCode.FlagNotFound,
      } satisfies EvaluationFailureResponse);
    });

    it('return EvaluationFailureResponse response as value on HTTP 400', async () => {
      const result = await api.postEvaluateFlags('my-flag', { context: { errors: { notFound: true } } });
      if (result.httpStatus !== 404) {
        throw new Error('Received unexpected HTTP status');
      }

      expect(result.value).toEqual({
        key: 'my-flag',
        errorCode: EvaluationFailureErrorCode.FlagNotFound,
      } satisfies EvaluationFailureResponse);
    });

    it('determine value type based on HTTP status', async () => {
      const result = await api.postEvaluateFlags('my-flag');
      expect(result.httpStatus).toEqual(200);

      // This is to check if the value type is determined by http status code
      if (result.httpStatus === 200) {
        expect(result.value.value).toBeDefined();
      } else {
        expect(result.value.errorCode).toBeDefined();
      }
    });

    it('return EvaluationSuccessResponse response as value on successful evaluation', async () => {
      const result = await api.postEvaluateFlags('my-flag', { context: { targetingKey: 'user' } });
      expect(result.httpStatus).toEqual(200);
      expect(result.value).toEqual({
        key: 'my-flag',
        reason: EvaluationSuccessReason.TargetingMatch,
        value: true,
        variant: 'default',
        metadata: {
          context: {
            targetingKey: 'user',
          },
        },
      } satisfies EvaluationSuccessResponse);
    });
  });

  describe('postBulkEvaluateFlags should', () => {
    it('throw OFREPApiFetchError on network error', async () => {
      await expect(() => api.postBulkEvaluateFlags({ context: { errors: { network: true } } })).rejects.toThrow(
        OFREPApiFetchError,
      );
    });

    it('throw OFREPApiUnexpectedResponseError on any error code without EvaluationFailureResponse body', async () => {
      await expect(() => api.postBulkEvaluateFlags({ context: { errors: { generic400: true } } })).rejects.toThrow(
        OFREPApiUnexpectedResponseError,
      );
    });

    it('throw OFREPForbiddenError on 401 response', async () => {
      await expect(() => api.postBulkEvaluateFlags({ context: { errors: { 401: true } } })).rejects.toThrow(
        OFREPApiUnauthorizedError,
      );
    });

    it('throw OFREPForbiddenError on 403 response', async () => {
      await expect(() => api.postBulkEvaluateFlags({ context: { errors: { 403: true } } })).rejects.toThrow(
        OFREPForbiddenError,
      );
    });

    it('throw OFREPApiTooManyRequestsError on 429 response', async () => {
      await expect(() => api.postBulkEvaluateFlags({ context: { errors: { 429: true } } })).rejects.toThrow(
        OFREPApiTooManyRequestsError,
      );
    });

    it('send empty request body if context is not given', async () => {
      const result = await api.postBulkEvaluateFlags();
      expect(result.httpStatus).toEqual(200);
    });

    it('send evaluation context in request body', async () => {
      const result = await api.postBulkEvaluateFlags({
        context: {
          targetingKey: 'user-1',
          key1: 'value1',
        },
      });

      if (result.httpStatus !== 200) {
        throw new Error('Received unexpected HTTP status');
      }

      expect(result.value).toEqual({
        flags: [
          {
            key: 'bool-flag',
            metadata: { context: { key1: 'value1', targetingKey: 'user-1' } },
            value: true,
          },
          {
            key: 'object-flag',
            metadata: {
              context: {
                key1: 'value1',
                targetingKey: 'user-1',
              },
            },
            value: {
              complex: true,
              nested: {
                also: true,
              },
            },
          },
        ],
      } satisfies BulkEvaluationSuccessResponse);
    });

    it('return HTTP status in result', async () => {
      const result = await api.postBulkEvaluateFlags();
      expect(result.httpStatus).toEqual(200);
    });

    it('return EvaluationFailureResponse response as value on failed evaluation', async () => {
      const result = await api.postBulkEvaluateFlags({ context: { errors: { targetingMissing: true } } });
      if (result.httpStatus !== 400) {
        throw new Error('Received unexpected HTTP status');
      }

      expect(result.value).toEqual({
        errorCode: EvaluationFailureErrorCode.TargetingKeyMissing,
      } satisfies BulkEvaluationFailureResponse);
    });

    it('determine value type based on HTTP status', async () => {
      const result = await api.postBulkEvaluateFlags();
      expect(result.httpStatus).toEqual(200);

      // This is to check if the value type is determined by http status code
      if (result.httpStatus === 200) {
        expect(result.value.flags).toBeDefined();
      } else {
        expect(result.value.errorCode).toBeDefined();
      }
    });

    it('return BulkEvaluationSuccessResponse response as value on successful evaluation', async () => {
      const result = await api.postBulkEvaluateFlags();
      expect(result.httpStatus).toEqual(200);
      expect(result.value).toEqual({
        flags: [
          {
            key: 'bool-flag',
            metadata: {},
            value: true,
          },
          {
            key: 'object-flag',
            metadata: {},
            value: {
              complex: true,
              nested: {
                also: true,
              },
            },
          },
        ],
      });
    });
  });
});
