import { useReducer, Reducer, useEffect, useRef, useMemo, } from 'react';
import { runSaga, stdChannel, Saga, Task } from 'redux-saga';
import { takeEvery, } from 'redux-saga/effects'
import * as sagaEffects from 'redux-saga/effects';

interface Action {
  type: string;
  [key: string]: any;
};

type Model<S> = {
  state: any,
  reducers?: {
    [key: string]: Reducer<S, Action>;
  },
  effects?: {
    [key: string]: Saga;
  },
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

export default function useSaga<S = {}>(model: Model<S>): [S, (action: Action) => void] {
  const {
    state: initialState,
    reducers = {},
    effects = {},
  } = model;

  // reducers
  const reducer = useMemo(() => {
    // default state updater
    const stateUpdater = Object.keys(initialState || {}).reduce<Object>((r, v) => ({ ...r, [defaultReducerKey(v)]: (state, action) => {
      return ({ ...state, [v]: action[v] })
    } }), {});
    const finalReducers = { ...stateUpdater, ...reducers};

    return (prevState: S, action: Action) => Object.keys(finalReducers).reduce((r, v) => v === action.type ? finalReducers[v](prevState, action) : r, prevState);
  }, [model]);
  const [state, dispatch] = useReducer(reducer, initialState);

  // effects
  const refState = useRef<S>(state);
  const refDispatch = useRef(dispatch);
  const refChannel = useRef(stdChannel());

  useEffect(() => {
    refState.current = state; 
    refDispatch.current = dispatch; 
  }, [state, dispatch]);

  useEffect(() => {
    const boundRunSaga = runSaga.bind(null, {
      channel: refChannel.current,
      dispatch: (...args) => refDispatch.current.apply(null, args),
      getState: () => refState.current,
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
      refChannel.current && refChannel.current.close();
    };
  }, []);

  return [state, (action: Action) => {
    refDispatch.current(action);
    refChannel.current.put(action)
  }];
};