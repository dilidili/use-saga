## useFetch
```jsx
  const Test: React.FC = () => {
    const [fetchUser, { start }] = useFetch(Api.fetchUser);

    return <div onClick={() => start()}>
      <div>{fetchUser.error ? 'error' : fetchUser.data ? fetchUser.data.id : 'empty'}</div>
      <div>{fetchUser.loading ? 'loading' : 'complete'}</div>
    </div>
  };
```