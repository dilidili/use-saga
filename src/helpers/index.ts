import { Saga } from 'redux-saga';
import { useCallback } from 'react';
import useSaga from '../core/useSaga';

type useFetchState = {
  loading: boolean;
  data: any | null;
  error: Error | null;
}; 

export const useFetch = (saga: Saga): [useFetchState, { start: Function }] => {
  const fetchDataSaga = useCallback(function* (action, { call, put }) {
    yield put({
      type: 'FETCH_IN_PROGRESS',
    });

    try {
      const data = yield call(saga, ...action.args);
      yield put({
        type: 'FETCH_SUCCEEDED',
        data,
      });
    } catch(error) {
      yield put({
        type: 'FETCH_FAILED',
        error,
      });
    }
  }, [saga]);

  const [state, dispatch] = useSaga<useFetchState>({
    state: {
      loading: false,
      data: null,
      error: null,
    },
    reducers: {
      ['FETCH_SUCCEEDED']: (_, { data }) => {
        return {
          loading: false,
          error: null,
          data,
        }
      },
      ['FETCH_FAILED']: (_, { error }) => {
        return {
          data: null,
          loading: false,
          error,
        }
      },
      [`FETCH_IN_PROGRESS`]: (state) => {
        return {
          ...state,
          loading: true,
        }
      },
    },
    effects: {
      ['FETCH_REQUESTED']: fetchDataSaga,
    },
  });

  return [state, {
    start: (...args) => dispatch({ type: 'FETCH_REQUESTED', args, }),
  }];
};