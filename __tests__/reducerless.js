import { createStore, applyMiddleware, compose } from 'redux';
import 'whatwg-fetch';
import fetchMock from 'fetch-mock';
import { reducerlessMiddleware, reducerlessEnhancer } from '../src';
import im from 'object-path-immutable';

test('fetch data and store in key', () => {
  //console.log('here', window.fetch);
  fetchMock.get('/api/foos', [
    { name: 'foo1' },
    { name: 'foo2' }
  ]);
  //fetchMock.get('/api/foos', { hello: 'world' });
  // fetch('/api/foos')
  // .then(r => {
  //     return r.json()        
  // })
  // .then(r => {
  //     console.log('here', r);
  // })
  const store = createStore(
    s => s,
    compose(
      applyMiddleware(
        // reducerlessMiddleware({
        //   setKey: (state, key, value) => im.set(state, key, value)
        // })
        reducerlessMiddleware
      ),
      reducerlessEnhancer,
    ),
  );
  store.dispatch({
    key: 'foos',
    url: '/api/foos'
  });
  expect(1).toBe(1);
});