import { combineReducers } from 'redux'

import { reducer as mainReducer } from './Redux'

// Set it up this way so if an app ended up wanting more reducers it would be as simple
// as adding the file and throwing them into the list below
export default combineReducers({
  app: mainReducer
})
