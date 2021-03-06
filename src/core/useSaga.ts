import { Reducer, useEffect, useState, useRef, } from 'react';
import { runSaga, stdChannel, Saga, Task } from 'redux-saga';
import { createStore, applyMiddleware, Store, Dispatch } from 'redux';
import { takeEvery, } from 'redux-saga/effects'
import * as sagaEffects from 'redux-saga/effects';
import Plugin from './Plugin';
import { check } from '../uitls';

export interface Action {
  type: string;
  [key: string]: any;
};

export type Effect = Saga<[Action, typeof sagaEffects & { setState: typeof setStateEffect }]>

export type Model<S = {}> = {
  state?: S,
  reducers?: {
    [key: string]: Reducer<S, Action>;
  },
  effects?: {
    [key: string]: Effect;
  },
  plugins?: Plugin[],
}

const defaultReducerKey = (v: string) => `update${v.slice(0, 1).toUpperCase()}${v.slice(1)}`;

const setStateEffect = function *(state) {
  const keys = Object.keys(state);

  for(let i = 0; i < keys.length; i++) {
    const key = keys[i];

    yield sagaEffects.put({
      type: defaultReducerKey(key),
      [key]: state[key],
    });
  }
}

const isEffectConflict = ([effects, initialState]) => {
  const eKeys = Object.keys(effects), sKeys = Object.keys(initialState);

  return !sKeys.some(v => ~eKeys.indexOf(defaultReducerKey(v)));
}

export default function useSaga<S>(model: Model<S>): [S, (action: Action) => void] {
  let {
    state: initialState,
    reducers = {},
    effects = {},
    plugins = [],
  } = model;

  if (plugins.length) {
    initialState = plugins.reduce((r, v) => v.applyState<S>(r), initialState);
    effects = plugins.reduce((r, v) => v.applyEffect(r), effects);
  }

  const [sagaState, setSagaState] = useState<S>(initialState);
  const refStore = useRef<Store | null>(null);

  useEffect(() => {
    // reducer
    const stateUpdater = Object.keys(initialState || {}).reduce<Object>((r, v) => ({ ...r, [defaultReducerKey(v)]: (state, action) => {
      return ({ ...state, [v]: action[v] })
    } }), {}); // default state updater
    let finalReducers = { ...stateUpdater, ...reducers };
    if (plugins.length) {
      finalReducers = plugins.reduce((r, v) => v.applyReducer(r), finalReducers);
    }
    const reducer = (prevState: S = initialState, action: Action) => Object.keys(finalReducers).reduce((r, v) => v === action.type ? finalReducers[v](prevState, action) : r, prevState);

    check([effects, initialState], isEffectConflict, `react-use-saga: effect passed by useSaga() should not named as "${defaultReducerKey('stateName')}"`);

    // store
    const channel = stdChannel();
    let boundRunSaga;
    const sagaMiddleware = ({ getState, dispatch }) => {
      boundRunSaga = runSaga.bind(null, {
        channel: channel,
        dispatch,
        getState,
      });

      return next => action => {
        const result = next(action); // hit reducers
        channel.put(action);
        return result;
      }
    } 
    const store = applyMiddleware(sagaMiddleware)(createStore)(reducer);
    refStore.current = store;

    const unsubscribe = store.subscribe(() => {
      setSagaState(store.getState());
    });

    const task: Task = boundRunSaga(function *() {
      const keys = Object.keys(effects);

      for(let i = 0; i < keys.length; i++) {
        yield takeEvery(keys[i], function* (action) {
          yield effects[keys[i]](action, { ...sagaEffects, setState: setStateEffect });
        });
      }
    });

    return () => {
      task && task.cancel();
      unsubscribe && unsubscribe();
      channel.close();
    };
  }, []);

  return [sagaState, (action: Action) => {
    refStore.current && refStore.current.dispatch(action);
  }];
};