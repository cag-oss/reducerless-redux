Reducerless Redux
==================
[brief description]

## Installation
```
npm install --save reducerless-redux
```

This assumes that you’re using [npm](http://npmjs.com/) package manager with a module bundler like [Webpack](http://webpack.github.io) or [Browserify](http://browserify.org/) to consume [CommonJS modules](http://webpack.github.io/docs/commonjs.html).

The following ES6 functions are required:

- [`Object.assign`](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Object/assign)
- [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)
- [`fetch`](https://developer.mozilla.org/en-US/docs/Web/API/GlobalFetch)

Check the compatibility tables ([`Object.assign`](https://kangax.github.io/compat-table/es6/#test-Object_static_methods_Object.assign), [`Promise`](https://kangax.github.io/compat-table/es6/#test-Promise), [`fetch`](http://caniuse.com/#feat=fetch)) to make sure all browsers and platforms you need to support have these, and include polyfills as necessary.

## Motivation

This project was inspired by [React-Refetch](https://github.com/heroku/react-refetch). I like the intuitive way that react-refetch maps url's to props, but I found myself wanting at the same time to leverage redux and react-redux connect's easy way of spreading data around nested heirarchies of components. The thing that turns me off about redux, however, is the proliferation of reducers. They always felt cumbersome, especially since the vast majority of the time all I want to is modify a particular piece of state. To that end I've created a redux middleware and store enhancer that maps url's to state, using a single "invisible" reducer. I also like the PromiseState that react-refetch uses, so all actions result in PromiseStates. The state to props mapping can be done by react-redux connect, which already does a great job at that. I thought about wrapping connect with something that would give you automatic fetching and refetching, but decided against it because the same thing can be achieved with [recompose](https://github.com/acdlite/recompose) in a more explicit way, without that much more code. 

## Example

Imagine we have a list of foos we want to display. Each foo has details, which we want to display next to the list for the selected foo. 

```jsx
// index.js
import React, { Component } from 'react';
import { render } from 'react-dom';
import { Provider } form 'react-redux';
import { createStore, applyMiddleware, compose } from 'redux';
import { reducerlessMiddleware, reducerlessEnhancer } from 'reducerless-redux';
import im from 'object-path-immutable';
import App from './my-app';

const store = createStore(
    null,
    null,
    compose(
        applyMiddleware(
        reducerlessMiddleware({
            setKey: (state, key, value) => im.set(state, key, value),
            getKey: (state, key, value) => im.get(state, key, value),
            getOpts: opts => {
            opts.headers = { 'X-Api-Token': 'token' };
            return opts;
            },
        })
        ),
        reducerlessEnhancer(),
    ),
);

render(
    <Provider store={store}>
        <App />
    </Provider>,
    document.getElementById('root')
);

// App.js - use lifecycle methods
import React, { Component } from 'react';
import { connect } from 'react-redux';

class FoosPage extends Component {
    componentDidMount() {
        this.props.getFoos();
    }
    componentWillReceiveProps(nextProps) {
        if (this.props.fooId !== nextProps.fooId ) {
            this.props.getFoo(id);
        }
    }
    render() {
        const { foos } = this.props;
        if (foos.pending) {
            return <Loading />
        } else if (foos.rejected) {
            return <Error .../>
        } else {
            return (
                <div>
                    <FoosList foos={foos.value} />
                    <FooDetail />
                </div>
            );
        }
    }
}
export default connect( (state, props) => {
    foos: 'foos',
    selFoo: 'selectedFoo'
},
{
    getFoos: () => ({
        url: '/api/foos',
        key: 'foos',
    }),
    getFoo: (id) => ({
        url: `/api/foos/${id}`,
        key: 'selectedFoo'
    })
})(FoosPage);

// App.js - use recompose to automatically fetch and update
import { compose, lifecycle } from 'recompose';

const FoosPage = ({ foos }) => {
    if (foos.pending) {
        return <Loading />
    } else if (foos.rejected) {
        return <Error .../>
    } else {
        return (
            <div>
                <FoosList foos={foos.value} />
                <FooDetail />
            </div>
        );
    }
}

compose(
    connect(
        // same as above
    ),
    lifecycle({
        componentDidMount() {
            this.props.getFoos();
        }
        componentWillReceiveProps(nextProps) {
            if (this.props.fooId !== nextProps.fooId ) {
                this.props.getFoo(id);
            }
        }
    }),
)(FoosPage)
```

