import { createStore, applyMiddleware, compose } from 'redux';
import 'whatwg-fetch';
import fetchMock from 'fetch-mock';
import { reducerlessMiddleware, reducerlessEnhancer } from '../src';
import im from 'object-path-immutable';

let store;
beforeEach(() => {
  store = createStore(
    null,
    null,
    compose(
      applyMiddleware(
        reducerlessMiddleware({
          setKey: (state, key, value) => im.set(state, key, value)
        })
        //reducerlessMiddleware()
      ),
      reducerlessEnhancer(),
    ),
  );

});

fetchMock.get('/api/foos', [
  { name: 'foo1' },
  { name: 'foo2' }
]);
fetchMock.get('/api/foo/1', {
  name: 'foo1', details: 'my details'
}) 

test('fetch data and store in simple key', () => {
  const prom = store.dispatch({
    key: 'foos',
    url: '/api/foos',
  });
  expect(store.getState().foos.pending).toBe(true);  
  return prom.then(result => {
    expect(store.getState().foos.value).toBe(result);
  });
});

test('fetch data and store in complex key', () => {
  const prom = store.dispatch({
    key: ['results', 'foos'],
    url: '/api/foos',
  });
  expect(store.getState().results.foos.pending).toBe(true);
  return prom.then(result => {
    expect(store.getState().results.foos.value).toBe(result);
  })
});

test('can specify update function that returns updated state', () => {
  const prom = store.dispatch({
    update: state => im.set(state, 'hello', 'kitty'),
  });
  expect(store.getState().hello).toBe('kitty');
});

test('can specify a transform on the action', () => {

});

test('call onFulfilled with response and dipatch', () => {

});

test('can supply http method on action', () => {

});