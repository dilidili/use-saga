import { Saga } from 'redux-saga';
import { useCallback } from 'react';
import { Model, Action } from '../core/useSaga';
import Plugin from '../core/Plugin';

type ActionTypes = {
  start: string;
  failed: string;
  succeed: string;
  begin: string;
  call: (...args: any[]) => Action;
}

const actionTypes = (namespace: string): ActionTypes => ({
  start: `${namespace}/FETCH_REQUESTED`,
  failed: `${namespace}/FETCH_FAILED`,
  succeed: `${namespace}/FETCH_SUCCEED`,
  begin: `${namespace}/FETCH_BEGIN`,
  call: (...args) => ({
    type: `${namespace}/FETCH_BEGIN`,
    args,
  }),
});

export type useFetchState = {
  data: any,
  loading: boolean,
  error: Error | null,
};

export const useFetchPlugin = (namespace: string = '', saga: Saga): [ActionTypes, Plugin] => {
  const actions = actionTypes(namespace);

  const fetchDataSaga = useCallback(function* (action, { call, put }) {
    yield put({
      type: actions.start,
    });

    try {
      const data = yield call(saga, ...action.args);
      yield put({
        type: actions.succeed,
        data,
      });
    } catch(error) {
      yield put({
        type: actions.failed,
        error,
      });
    }
  }, [saga, namespace]);

  return [actions, new Plugin(namespace, {
    state: {
      loading: false,
      data: null,
      error: null,
    },
    reducers: {
      [actions.succeed]: (_, { data }) => {
        return {
          loading: false,
          error: null,
          data,
        }
      },
      [actions.failed]: (_, { error }) => {
        return {
          data: null,
          loading: false,
          error,
        }
      },
      [actions.start]: (state) => {
        return {
          ...state,
          error: null,
          loading: true,
        }
      },
    },
    effects: {
      [actions.begin]: fetchDataSaga,
    },
  })];
}