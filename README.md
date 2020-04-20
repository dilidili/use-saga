## Basic Usage 

```tsx
const Api = {
  fetchUser: function* (id = 'test') {
    return { id };
  },
};

export function* fetchData(action, { call, put }) {
  const data = yield call(Api.fetchUser, action.url);
  yield put({ type: "FETCH_SUCCEEDED", data });
}

const Test: React.FC<{ fetchData }> = ({ fetchData }) => {
  const [state, dispatch] = useSaga<{
    data: {
      id: string,
    } | null, 
    error: Error | null,
  }>({
    state: {
      data: null,
      error: null,
    },
    reducers: {
      ['FETCH_SUCCEEDED']: (state, { data }) => {
        return { ...state, data };
      },
      ['FETCH_FAILED']: (state, { error }) => {
        return { ...state, error };
      },
    },
    effects: {
      ['FETCH_REQUESTED']: fetchData,
    },
  });

  return <div onClick={() => dispatch({ type: 'FETCH_REQUESTED', url: 'test' })}>{state.error ? 'error' : state.data ? state.data.id : 'loading'}</div>;
};
```

## Default update state action

```tsx
const Test: React.FC = () => {
  const [{ count }, dispatch] = useSaga({
    state: {
      count: 0,
    },
  });

  return <div onClick={() => dispatch({ type: 'updateCount', count: 1 })}>
    <div>{count}</div>
  </div>
};
```

## Use setState Effect

```tsx
const Test: React.FC = () => {
  const [{ count, touched }, dispatch] = useSaga({
    state: {
      count: 0,
      touched: false,
    },

    effects: {
      updateCount: function *({ count }, { setState }) {
        yield setState({
          count,
          touched: true,
        });
      },
    },
  });

  return <div onClick={() => dispatch({ type: 'updateCount', count: 2 })}>
    <div>{count}</div>
    <div>{touched + ''}</div>
  </div>
};
```

## Use useFetch Effect
```jsx
  const Test: React.FC = () => {
    const [fetchUserActions, fetchUserPlugin] = useFetchPlugin('fetchUser', function *(id) { return { id, } });

    const [state, dispatch] = useSaga<{
      fetchUser: useFetchState,
    }>({
      plugins: [
        fetchUserPlugin,
      ],
    });

    return <div onClick={() => dispatch(fetchUserActions.call('target'))}>
      <div>{state.fetchUser.data ? state.fetchUser.data.id : ''}</div>
    </div>
  };
```