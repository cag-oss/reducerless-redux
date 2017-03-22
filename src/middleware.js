import PromiseState from './PromiseState';
import { type } from './common';

const defaultSetKey = (state, key, value) => Object.assign({}, state, { [key]: value });

const middleware = (props = {}) => store => next => action => {
  if (action.type && action.type !== type) {
    next(action);
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

  return new Promise((resolve, reject) => {
    next(makeAction(action.key, PromiseState.create()));
    const opts = {
      method: action.method || 'GET',
      body: action.body,
    };
    
    fetch(action.url, props.getOpts ? props.getOpts(opts) : opts)
    .then(res => {
      if (res.ok) {
        return action.handleResponse ? action.handleResponse(res) : res.json();
      } else {
        const error = new Error(res.statusText);
        error.response = res;
        throw error;
      }
    })
    .then(json => {
      const result = action.transform ? action.transform(json) : json;
      
      const ps = PromiseState.resolve(result)
      next(makeAction(action.key, ps));
      if (action.onFulfilled) {
        action.onFulfilled(ps, store.dispatch);
      }
      resolve(ps);
    })
    .catch(err => {
      const ps = PromiseState.reject(err)
      next(makeAction(action.key, ps));
      reject(ps);
    })
  });
}

export default middleware;
