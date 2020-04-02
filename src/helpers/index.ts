import { Saga } from 'redux-saga';
import { useCallback } from 'react';
import useSaga, { Model, extendModel } from '../core/useSaga';

type useFetchState = {
  loading: boolean;
  data: any | null;
  error: Error | null;
};

const actionTypes = {
  startFetch: 'FETCH_REQUESTED',
  fetchInProgress: 'FETCH_IN_PROGRESS',
  fetchSucceed: 'FETCH_SUCCEED',
  fetchFailed: 'FETCH_FAILED',
};

export const useFetch = (saga: Saga, modelFactory?: (types: typeof actionTypes) => Model<any>): [useFetchState, { startFetch: Function, dispatch: Function }] => {
  const model = modelFactory ? modelFactory(actionTypes) : {};

  const fetchDataSaga = useCallback(function* (action, { call, put }) {
    yield put({
      type: actionTypes.fetchInProgress,
    });

    try {
      const data = yield call(saga, ...action.args);
      yield put({
        type: actionTypes.fetchSucceed,
        data,
      });
    } catch(error) {
      yield put({
        type: actionTypes.fetchFailed,
        error,
      });
    }
  }, [saga]);

  const [state, dispatch] = useSaga<any | useFetchState>(extendModel({
    state: {
      loading: false,
      data: null,
      error: null,
    },
    reducers: {
      [actionTypes.fetchSucceed]: (_, { data }) => {
        return {
          loading: false,
          error: null,
          data,
        }
      },
      [actionTypes.fetchFailed]: (_, { error }) => {
        return {
          data: null,
          loading: false,
          error,
        }
      },
      [actionTypes.fetchInProgress]: (state) => {
        return {
          ...state,
          loading: true,
        }
      },
    },
    effects: {
      [actionTypes.startFetch]: fetchDataSaga,
    },
  }, model));

  return [state, {
    startFetch: (...args) => dispatch({ type: actionTypes.startFetch, args, }),
    dispatch,
  }];
};