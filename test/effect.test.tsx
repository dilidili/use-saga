import useSaga, { useFetch, } from '../src';
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

          yield setState({
            count: 1,
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