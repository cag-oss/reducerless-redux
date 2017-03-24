import { createStore, applyMiddleware, compose } from 'redux';
import 'whatwg-fetch';
import fetchMock from 'fetch-mock';
import { reducerlessMiddleware, reducerlessEnhancer } from '../src';
import im from 'object-path-immutable';

let store;
let numRetryCalled;
beforeEach(() => {
  fetchMock.reset();
  store = createStore(
    null,
    null,
    compose(
      applyMiddleware(
        reducerlessMiddleware({
          setKey: (state, key, value) => im.set(state, key, value),
          getOpts: opts => {
            opts.headers = { 'X-Api-Token': 'token' };
            return opts;
          },
        })
      ),
      reducerlessEnhancer(),
    ),
  );
  numRetryCalled = 0;
});

afterAll(fetchMock.restore);

fetchMock.get('/api/foos', [
  { name: 'foo1' },
  { name: 'foo2' }
]);
fetchMock.get('/api/foo/1', {
  name: 'foo1', details: 'my details'
});
fetchMock.post('/api/foo', (url, opts) => {
  return opts.body;
});
fetchMock.post('/api/opts', (url, opts) => {
  return { body: { headers: opts.headers } };
});
fetchMock.get('/api/err', { status: 500 });
fetchMock.get('/api/test', { foo: 'bar' });
fetchMock.get('/api/retry', (url, opts) => {
  if (numRetryCalled < 2) {
    numRetryCalled += 1;
    return { status: 500 };
  }
  return { foo: 'bar' };
});
fetchMock.get('/api/bars', []);

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
  store.dispatch({
    update: state => im.set(state, ['hello'], 'kitty'),
  });
  expect(store.getState().hello).toBe('kitty');
});

test('can specify a transform on the action', () => {
  return store.dispatch({
    key: 'foo',
    url: '/api/foo/1',
    transform: data => {
      data.details = 'no details';
      return data;
    } 
  })
  .then(result => {
    expect(store.getState().foo.value).toEqual({ name: 'foo1', details: 'no details' });
  })
});

test('can supply http method on action', () => {
  return store.dispatch({
    key: 'addFooResp',
    url: '/api/foo',
    method: 'POST',
    body: { name: 'newFoo' },
  })
  .then(_ => {
    expect(store.getState().addFooResp.value).toEqual({ name: 'newFoo' });
  });
});

test('call onFulfilled with response and dipatch', (done) => {
  store.dispatch({
    key: 'addFooResp',
    url: '/api/foo',
    method: 'POST',
    body: { name: 'newFoo' },
    onFulfilled: (data, dispatch) => {
      //expect(data).toEqual({ name: 'newFoo' });
      //expect(dispatch).toBe(store.dispatch);
      dispatch({
        update: state => im.set(state, 'hello', 'kitty'),
      });
      expect(store.getState().hello).toBe('kitty');
      expect(store.getState().addFooResp.value).toEqual({ name: 'newFoo' });
      done();
    }
  });
});

test('customize request options with getOptions()', () => {
  return store.dispatch({
    key: 'postResp',
    url: '/api/opts',
    method: 'POST',
  })
  .then(result => { 
    expect(store.getState().postResp.value.headers).toEqual({ 'X-Api-Token': 'token' });
  });
});

test('handles http errors', (done) => {
  store.dispatch({
    key: 'foos',
    url: '/api/err',
  })
  .catch(err => {
    expect(err.reason.response.status).toBe(500);
    done();
  })
});

test('can override default response handling on a per action level', () => {
  return store.dispatch({
    key: 'foos',
    url: '/api/test',
    handleResponse: response => {
      return response.text();
    }
  })
  .then(result => {
    expect(store.getState().foos.value).toEqual(JSON.stringify({ foo: 'bar' })); 
  })
});

test('can repeat an action on a predefined interval', (done) => {
  store.dispatch({
    key: 'foos',
    url: '/api/foos',
    refreshInterval: 1,
  });
  setTimeout(() => {
    const calls = fetchMock.calls('/api/foos').length;
    expect(calls).toBeGreaterThan(5);
    done(); 
  }, 200);

});

test('can retry an action based on action.maxRetry', () => {
  return store.dispatch({
    key: 'foos',
    url: '/api/retry',
    maxRetry: 3,
    retryBackoff: 1
  })
  .then(result => {
    const expected = store.getState().foos.value;
    expect(expected).toEqual({ foo: 'bar' });    
  });
});

test('multiple dispatches of a repeating action will not fetch the url again', (done) => {
  store.dispatch({
    key: 'foos',
    url: '/api/foos',
    refreshInterval: 1,
  });
  setTimeout(() => {
    store.dispatch({
      key: 'foos',
      url: '/api/foos',
    })
    .then(result => {
      expect(result).toEqual({ refreshing: true });
      done();
    })
  }, 100);
});

test('do not fetch (GET) a url that is pending fetch', (done) => {
  store.dispatch({
    key: 'foos',
    url: '/api/foos',
  });
  store.dispatch({
    key: 'foos',
    url: '/api/foos',
  })
  .then(result => {
    expect(result).toEqual({ pending: true });
    done();
  });
});

test('can clear auto refreshing actions', (done) => {
  const url = '/api/bars'; 
  console.log('calls', fetchMock.calls(url).length);
  store.dispatch({
    key: 'foos',
    url: url,
    refreshInterval: 1,
  });
  setTimeout(() => {
    store.dispatch({
      clearRefresh: true,
    });
    const callsNow = fetchMock.calls(url).length;
    setTimeout(() => {
      const callsLater = fetchMock.calls(url).length;
      expect(callsNow).toBe(callsLater);
      done();
    }, 100);
    
  }, 100)
});