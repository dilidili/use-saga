import useSaga, { useFetchPlugin, useFetchState } from '../src';
import React from 'react';
import renderer from 'react-test-renderer';

test('put effect can trigger another effect', () => {
  const Test: React.FC = () => {
    const [{ count, }, dispatch] = useSaga({
      state: {
        count: 0,
      },

      effects: {
        toOne: function *(_, { put, setState }) {
          yield put({
            type: 'toTwo',
          });
        },
        toTwo: function *(_, { setState }) {
          yield setState({ count: 2 });
        },
      },
    });

    return <div onClick={() => dispatch({ type: 'toOne', })}>
      <div>{count}</div>
    </div>
  };

  let component
  renderer.act(() => {
    component = renderer.create(<Test />);
  });
  let tree = component.toJSON();
  renderer.act(() => {
    tree.props.onClick();
  });
  tree = component.toJSON();
  expect(tree).toMatchSnapshot();
});

test('useFetch plugin', () => {
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

  let component
  renderer.act(() => {
    component = renderer.create(<Test />);
  });
  let tree = component.toJSON();
  renderer.act(() => {
    tree.props.onClick();
  });
  tree = component.toJSON();
  expect(tree).toMatchSnapshot();
});