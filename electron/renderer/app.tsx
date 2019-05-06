import { ipcRenderer } from 'electron'
import { configureStore } from '../../src/configureStore'
import Notes from '../../src/Notes'
/* tslint:disable-next-line */
import storage from 'redux-persist/lib/storage'
// import Notes from '@textile/notes-desktop'
/* tslint:disable-next-line */
import { PersistGate } from 'redux-persist/integration/react'
import { Provider } from 'react-redux'
import React from 'react'
import ReactDOM from 'react-dom'

import './app.scss'

const root = document.getElementById('app')

export interface AppProps {}
interface State { }
// @ts-ignore
const { store, persistor } = configureStore(storage)
class App extends React.Component<AppProps, State> {
  constructor(props: AppProps) {
    super(props)
  }

  public render() {
    // Example to show load delay
    setTimeout(() => {
      ipcRenderer.send('app-is-ready')
    }, 5000)
    return (
      <div className="app">
        <Provider store={store}>
          <PersistGate loading={undefined} persistor={persistor}>
            <Notes />
          </PersistGate>
        </Provider>
      </div>
    )
  }
}

ReactDOM.render(<App />, root)
