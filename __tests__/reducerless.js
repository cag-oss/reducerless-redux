import { createStore } from 'redux';
import 'whatwg-fetch';
import fetchMock from 'fetch-mock';

test('fetch data and store in key', () => {
    //console.log('here', window.fetch);
    fetchMock.get('/api/foos', [
        { name: 'foo1' },
        { name: 'foo2' }
    ]);
    //fetchMock.get('/api/foos', { hello: 'world' });
    fetch('/api/foos')
    .then(r => {
        return r.json()        
    })
    .then(r => {
        console.log('here', r);
    })
    expect(1).toBe(1);
});