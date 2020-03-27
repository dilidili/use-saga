import useSaga, { useFetch, } from '../src';
import React from 'react';
import renderer from 'react-test-renderer';

const Api = {
  fetchUser: function* (id = 'test') {
    return { id };
  },
};

export function* fetchData(action, { call, put }) {
  const data = yield call(Api.fetchUser, action.url);
  yield put({ type: "FETCH_SUCCEEDED", data });
}

export function* fetchDataFail(action, { put }) {
  yield put({ type: "FETCH_FAILED", error: new Error() });
}

test('common AJAX request', function() {
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

  // success flow
  let component
  renderer.act(() => {
    component = renderer.create(<Test fetchData={fetchData} />);
  });

  let tree = component.toJSON();
  expect(tree).toMatchSnapshot();

  renderer.act(() => {
    tree.props.onClick();
  });

  tree = component.toJSON();
  expect(tree).toMatchSnapshot();

  // fail flow
  let failComponent;
  renderer.act(() => {
    failComponent = renderer.create(<Test fetchData={fetchDataFail} />);
  });

  let failTree = failComponent.toJSON();
  renderer.act(() => {
    failTree.props.onClick();
  });

  failTree = failComponent.toJSON();
  expect(failTree).toMatchSnapshot();
});

test('useFetch helper', () => {
  const Test: React.FC<{ fetchData }> = ({ fetchData }) => {
    const [fetchUser, { start }] = useFetch(fetchData);

    return <div onClick={() => start('leisure life')}>
      <div>{fetchUser.error ? 'error' : fetchUser.data ? fetchUser.data.id : 'empty'}</div>
      <div>{fetchUser.loading ? 'loading' : 'complete'}</div>
    </div>
  };

  // success flow
  let component
  renderer.act(() => {
    component = renderer.create(<Test fetchData={Api.fetchUser} />);
  });

  let tree = component.toJSON();
  expect(tree).toMatchSnapshot();

  renderer.act(() => {
    tree.props.onClick();
  });

  tree = component.toJSON();
  expect(tree).toMatchSnapshot();

  // fail flow
  let failComponent;
  renderer.act(() => {
    failComponent = renderer.create(<Test fetchData={function *() { throw Error() }} />);
  });

  let failTree = failComponent.toJSON();
  renderer.act(() => {
    failTree.props.onClick();
  });

  failTree = failComponent.toJSON();
  expect(failTree).toMatchSnapshot();
});