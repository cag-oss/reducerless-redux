
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
}
function reducerEnhancer(rootReducer = _ => ({})) {
  return function (state, action) {
    return Object.assign({}, rootReducer(state, action), reduce(state, action));
  }
}
function storeEnhancer() {
  return function (createStore) {
    return function (reducer, preloadedState) {
      return createStore(reducerEnhancer(reducer), preloadedState);
    }
  }
}

export default storeEnhancer;