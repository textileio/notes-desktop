import * as React from 'react'
import { render } from 'react-dom'
import Notes from './Notes'

import { createStore, applyMiddleware, compose } from 'redux'
import createSagaMiddleware from 'redux-saga'
import { Provider } from 'react-redux'

import storage from 'redux-persist/lib/storage'
import { PersistGate } from 'redux-persist/integration/react'
import { persistStore, persistReducer, PersistConfig } from 'redux-persist'

import AppActions from './Redux/Redux'
import rootReducer from './Redux/RootReducer'
import rootSaga from './Redux/Sagas'

const persistConfig: PersistConfig = {
  key: 'io.textile.pages',
  storage
}

const persistedReducer = persistReducer(persistConfig, rootReducer)

// create the saga middleware
const sagaMiddleware = createSagaMiddleware()

interface Window {
  [key: string]: any // Add index signature
}
const w = window as Window
const reduxDevTools: any = w['__REDUX_DEVTOOLS_EXTENSION__'] && w['__REDUX_DEVTOOLS_EXTENSION__']()

const store = createStore(
  persistedReducer,
  compose(applyMiddleware(sagaMiddleware), reduxDevTools)
)

const bootstrappedCallback = () => store.dispatch(AppActions.startup())
const persistor = persistStore(store, undefined, bootstrappedCallback)

// run the saga
sagaMiddleware.run(rootSaga)

render(
  <Provider store={store}>
    <PersistGate loading={undefined} persistor={persistor}>
      <Notes />
    </PersistGate>
  </Provider>,
  document.getElementById('main')
)
