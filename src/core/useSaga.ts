import { useReducer, Reducer, useEffect, useRef } from 'react';
import { runSaga, stdChannel, Saga } from 'redux-saga';
import { takeEvery, call, put } from 'redux-saga/effects'

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


export default function useSaga<S = {}>(model: Model<S>): [S, (action: Action) => void] {
  const {
    state: initialState,
    reducers = {},
    effects = {},
  } = model;

  // reducers
  const reducer = (prevState: S, action: Action) => Object.keys(reducers).reduce((r, v) => v === action.type ? reducers[v](prevState, action) : r, prevState);
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

    boundRunSaga(function *() {
      const keys = Object.keys(effects);
      for(let i = 0; i < keys.length; i++) {
        yield takeEvery(keys[i], function* (action) {
          yield effects[keys[i]](action, { call, put });
        });
      }
    });
  }, []);

  return [state, (action: Action) => {
    refChannel.current.put(action)
  }];
};