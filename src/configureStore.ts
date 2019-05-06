import { createStore, applyMiddleware, compose } from 'redux'
import createSagaMiddleware from 'redux-saga'
import { persistStore, persistReducer, PersistConfig, WebStorage, LocalForageStorage, AsyncStorage } from 'redux-persist'

import AppActions from './Redux/Redux'
import rootReducer from './Redux/RootReducer'
import rootSaga from './Redux/Sagas'

export const configureStore = (storageChoice: WebStorage | AsyncStorage | LocalForageStorage | Storage) => {
  const persistConfig: PersistConfig = {
    key: 'io.textile.pages',
    storage: storageChoice
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
    // applyMiddleware(sagaMiddleware)
    compose(applyMiddleware(sagaMiddleware), reduxDevTools)
  )

  const bootstrappedCallback = () => store.dispatch(AppActions.startup())
  const persistor = persistStore(store, undefined, bootstrappedCallback)

  // run the saga
  sagaMiddleware.run(rootSaga)

  return { store, persistor }
}
