import PromiseState from './PromiseState';

const middleware = store => next => action => {
  const makeAction = (key, value) => ({
    key,
    value,
    setKey: (state, key, value) => Object.assign({}, state, { [key]: value }),
  });
  console.log('here:', store, next, action);
  
  return new Promise((resolve, reject) => {
    next(makeAction(action.key, PromiseState.create())); 
    fetch(action.url)
    .then(res => res.json())
    .then(json => {
      const ps = PromiseState.resolve(json)
      next(makeAction(action.key, ps));
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
