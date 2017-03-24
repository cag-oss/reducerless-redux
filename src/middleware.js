import PromiseState from './PromiseState';
import { type } from './common';

const defaultSetKey = (state, key, value) => Object.assign({}, state, { [key]: value });

const repeating = {};

const retry = (action, props) => {
  // retry algorithm credit: alalonde/retry-promise
  const max = action.maxRetry || 1;
  const backoff = action.retryBackoff || 1000;

  return new Promise((resolve, reject) => {
    const attempt = i => {
      const opts = {
        method: action.method || 'GET',
        body: action.body,
      };
      const finalOpts = props.getOpts ? props.getOpts(opts) : opts;
      fetch(action.url, finalOpts) 
      .then(res => {
        if (res.ok) {
          return action.handleResponse ? action.handleResponse(res) : res.json();
        } else {
          const error = new Error(res.statusText);
          error.response = res;
          throw error;
        }
      })
      .then(resolve)
      .catch(err => {
        if (i >= max) {
          reject(err);
        }
        setTimeout(() => attempt(i + 1) , i * backoff);
      })
    }
    attempt(1);
  });
}

const isGet = a => !a.method || a.method.toUpperCase() === 'GET'

const middleware = (props = {}) => store => next => action => {
  if (!store._refreshing) store._refreshing = {};
  if (!store._pending) store._pending = {};
  if (action.type && action.type !== type) {
    next(action);
    return;
  }
  if(action.clearRefresh) {
    store._refreshing = {};
    return; 
  }
  if (action.update && typeof action.update === 'function') {
    next({
      type,
      update: action.update,
    });
    return;
  } 
  const makeAction = (key, value) => ({
    type,
    key,
    value,
    setKey: props.setKey || defaultSetKey, 
  });
  if (store._refreshing[action.url] && !action._refreshing) {
    return Promise.resolve({ refreshing: true });
  }
  if (isGet(action) && store._pending[action.url]) {
    return Promise.resolve({ pending: true });
  }
  if (action.refreshInterval) {
    store._refreshing[action.url] = true;
  }
  return new Promise((resolve, reject) => {
    next(makeAction(action.key, PromiseState.create()));
    if (isGet(action)) {
      store._pending[action.url] = true;
    } 
    retry(action, props) 
    .then(json => {
      const result = action.transform ? action.transform(json) : json;
      
      const ps = PromiseState.resolve(result)
      next(makeAction(action.key, ps));
      if (action.onFulfilled) {
        action.onFulfilled(ps, store.dispatch);
      }
      delete store._pending[action.url];
      resolve(ps);
      if (action.refreshInterval && store._refreshing[action.url]) {
        const newAction = Object.assign({}, action, { _refreshing: true });
        setTimeout(() => {
          if(store._refreshing[action.url]) {
            store.dispatch(newAction);
          }
        }, action.refreshInterval);
      }
    })
    .catch(err => {
      delete store._refreshing[action.url];
      delete store._pending[action.url];
      const ps = PromiseState.reject(err)
      next(makeAction(action.key, ps));
      reject(ps);
    })
  });
}

export default middleware;
