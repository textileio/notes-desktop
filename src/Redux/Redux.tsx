// action types
import { createAction, ActionType, getType } from 'typesafe-actions'
import { RootState } from './Types'
import { Value } from 'slate';

const actions = {
  logout: createAction('app/LOGOUT'),
  startup: createAction('app/Startup'),
  startupSuccess: createAction('app/StartupSuccess'),
  connectionFailure: createAction('app/ConnectionFailure'),
  getDisplayName: createAction('app/GetDislpayName'),
  setDisplayName: createAction('app/SetDisplayName', (resolve) => {
    return (name: string) => resolve({name})
  }),
  createOrUpdateThread: createAction('app/CreateOrUpdateThread'),
  setThreadId: createAction('app/SetThreadId', (resolve) => {
    return (threadId: string) => resolve({threadId})
  }),
  addOrUpdate: createAction('app/AddOrUpdate', (resolve) => {
    return (note: Note) => resolve({note})
  }),
  linkBlockToNote: createAction('app/LinkBlockToNote', (resolve) => {
    return (note: Note, block: string) => resolve({note, block})
  }),
  selectNote: createAction('app/SelectNote', (resolve) => {
    return (note: Note) => resolve({note})
  }),
  updateActiveNote: createAction('app/UpdateActiveNote', (resolve) => {
    return (value: Value) => resolve({value})
  }),
  saveNote: createAction('app/SaveNote', (resolve) => {
    return (note: string, select?: boolean) => resolve({note, select})
  }),
  setNotes: createAction('app/setNotes', (resolve) => {
    return (notes: Note[], activeNote?: Note) => resolve({notes, activeNote})
  }),
  clearNote: createAction('app/ClearNote'),
  deleteNote: createAction('app/DeleteNote'),
  deleteNoteSuccess: createAction('app/DeleteNoteSuccess'),
  deleteNoteFailure: createAction('app/DeleteNoteFailure', (resolve) => {
    return (block: string) => resolve({block})
  }),
  syncDeleteSuccess: createAction('app/SyncDeleteSuccess', (resolve) => {
    return (block: string) => resolve({block})
  }),
  markOutOfDate: createAction('app/MarkOutOfDate'),
  markSynced: createAction('app/MarkSynced')
}

export type AppActions = ActionType<typeof actions>


export interface Note {
  key: string
  json: any
  created: number
  updated: number
  block?: string
  threadId?: string
}

// ActiveNote is different since we want to hang onto a UI ready value + an old block ID we should delete if we save
export interface ActiveNote extends Note {
  value: Value
  refBlock?: string
}

export interface AppState {
    connection: 'starting' | 'success' | 'failure'
    sessions: number 
    notes: ReadonlyArray<Note>
    pendingDeletes: ReadonlyArray<string>
    appThreadId?: string
    activeNote?: ActiveNote
    name?: string
    unsynced?: boolean
}

// reducer with initial state
const initialState: AppState = {
  connection: 'starting',
  sessions: 0,
  notes: [],
  pendingDeletes: []
}

export const AppSelectors = {
  notes: (state: RootState, blockless?: boolean) => blockless ? state.app.notes.filter((note) => !note.block) : state.app.notes,
  activeNote: (state: RootState) => state.app.activeNote,
  appThreadId: (state: RootState) => state.app.appThreadId,
  selectPendingDelete: (state: RootState) => state.app.pendingDeletes.length > 0 ? state.app.pendingDeletes[0] : undefined,
  connected: (state: RootState) => state.app.connection === 'success'
}

export function reducer(state: AppState = initialState, action: AppActions): AppState {
  switch (action.type) {
    case getType(actions.logout): {
      return initialState
    }
    case getType(actions.startup): {
      return {...state, connection: 'starting'}
    }
    case getType(actions.startupSuccess): {
      return {...state, connection: 'success', sessions: state.sessions + 1}
    }
    case getType(actions.connectionFailure): {
      return {...state, connection: 'failure'}
    }
    case getType(actions.setThreadId): {
      return {...state, appThreadId: action.payload.threadId}
    }
    case getType(actions.updateActiveNote): {
      const { value } = action.payload
      const updated = (new Date).getTime()
      const activeNote = state.activeNote || {
        key: String(updated) + String(value.hashCode()),
        value,
        updated,
        created: updated,
        json: {}
      }
      if (activeNote) {
        activeNote.value = value
        activeNote.updated = updated
      } else {

      }
    }
    case getType(actions.addOrUpdate): {
      const { note } = action.payload
      const exists = state.notes.find((n) => n.key === note.key)
      var final = note
      if (exists) {
        // if your thread stored note is newer, base of it
        if (note.updated > exists.updated) {
          final = note
        } else {
          final = {...exists, block: note.block}
        }
      }

      const notes = state.notes.filter((n) => n.key !== final.key)
      notes.push(final)
      
      const activeNote = state.activeNote
      if (activeNote && activeNote.key === final.key) {
        activeNote.block = final.block
      }

      return {...state, notes, activeNote}
    }
    case getType(actions.linkBlockToNote): {
      const { note, block } = action.payload
      const updatedNotes = state.notes.map((existing) => {
        if (note.key === existing.key) {
          return {...note, block}
        }
        return existing
      })
      return {
        ...state,
        notes: updatedNotes,
        activeNote: state.activeNote && state.activeNote.key === note.key ? {...note, block} : state.activeNote
      }
    }
    case getType(actions.setDisplayName): {
      const { name } = action.payload
      return {...state, name}
    }
    case getType(actions.clearNote): {
      return {...state, activeNote: undefined}
    }
    case getType(actions.selectNote): {
      const { note } = action.payload
      return {...state, activeNote: note}
    }
    case getType(actions.setNotes): {
      return {
        ...state,
        notes: action.payload.notes,
        activeNote: action.payload.activeNote
      }
    }
    case getType(actions.deleteNoteSuccess): {
      const { activeNote, notes } = state
      if (!activeNote) {
        return state
      }
      return {
        ...state,
        activeNote: undefined,
        notes: notes.filter((note) => note.key !== activeNote.key)
      }
    }
    case getType(actions.deleteNoteFailure): {
      const { block } = action.payload
      return {
        ...state,
        pendingDeletes: [...state.pendingDeletes, block]
      }
    }
    case getType(actions.syncDeleteSuccess): {
      const { block } = action.payload
      return {
        ...state,
        pendingDeletes: state.pendingDeletes.filter((existing) => existing !== block)
      }
    }
    case getType(actions.markOutOfDate): {
      return {
        ...state,
        unsynced: true
      }
    }
    case getType(actions.markSynced): {
      return {
        ...state,
        unsynced: false
      }
    }
    default:
      return state
  }
}

export default actions
