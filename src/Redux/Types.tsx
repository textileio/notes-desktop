import { StateType } from 'typesafe-actions'
import { PersistPartial } from 'redux-persist'

import RootReducer from './RootReducer'
import { AppActions } from './Redux'

export type RootState = StateType<typeof RootReducer> & PersistPartial
export type RootAction =
  AppActions
