import { Model } from "./useSaga";

export default class Plugin {
  constructor(public namespace: string, public model: Model) {}

  applyState<S>(state: S): S {
    return {
      ...state,
      [this.namespace]: this.model.state,
    };
  }

  applyReducer(reducer) {
    if (this.model.reducers) {
      reducer = Object.keys(this.model.reducers).reduce((r, v) => {
        return {
          ...r,
          [v]: (state, action) => {
            return {
              ...state,
              [this.namespace]: this.model.reducers[v](state[this.namespace], action),
            };
          }
        }
      }, reducer);
    }

    return {
      ...reducer,
    }
  }

  applyEffect(effects) {
    return {
      ...effects,
      ...(this.model.effects || {}),
    };
  }
}