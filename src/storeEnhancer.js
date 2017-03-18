
function isReducerlessAction(action) {
  if (action.key !== undefined) {
    return true;
  }
  return false;
}
function reduce(state = {}, action) {
  if (isReducerlessAction(action)) {
    return action.setKey(state, action.key, action.value)
  }
  return state;
}
function reducerEnhancer(rootReducer) {
  return function (state, action) {
    return Object.assign({}, rootReducer && rootReducer(state, action), reduce(state, action));
  }
}
function storeEnhancer() {
  return function (createStore) {
    return function (reducer, preloadedState, enhancer) {
      const store = createStore(reducerEnhancer(reducer), preloadedState, enhancer); 
      return store;
    }
  }
}

export default storeEnhancer;