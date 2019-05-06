import * as React from 'react'
import { render } from 'react-dom'
import { configureStore } from './configureStore'

import { Provider } from 'react-redux'

import storage from 'redux-persist/lib/storage'
import { PersistGate } from 'redux-persist/integration/react'

import Notes from './Notes'

// Only start the UI if in the browser
const userAgent = navigator.userAgent.toLowerCase()
if (userAgent.indexOf(' electron/') === -1) {
  const { store, persistor } = configureStore(storage)
  render(
    <Provider store={store}>
      <PersistGate loading={undefined} persistor={persistor}>
        <Notes />
      </PersistGate>
    </Provider>,
    document.getElementById('app')
  )
}
