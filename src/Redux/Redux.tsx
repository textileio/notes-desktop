// action types
import { createAction, ActionType, getType } from 'typesafe-actions'
import { RootState } from './Types'
import { Value, ValueJSON, Block } from 'slate'
import { Md5 } from 'ts-md5/dist/md5'
import moment = require('moment')

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
  updateActiveNote: createAction('app/UpdateActiveNote', (resolve) => {
    return (value: Value) => resolve({value})
  }),
  addOrUpdate: createAction('app/AddOrUpdate', (resolve) => {
    return (note: Note) => resolve({note})
  }),
  linkBlockToNote: createAction('app/LinkBlockToNote', (resolve) => {
    return (key: string, block: string) => resolve({key, block})
  }),
  selectNote: createAction('app/SelectNote', (resolve) => {
    return (note: Note) => resolve({note})
  }),
  saveNote: createAction('app/SaveNote'),
  saveNoteSuccess: createAction('app/SaveNoteSuccess'),
  setNotes: createAction('app/setNotes', (resolve) => {
    return (notes: Note[]) => resolve({notes})
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
  text: string
  value: ValueJSON
  created: number
  updated: number
  block?: string
  threadId?: string
}

// ActiveNote is different since we want to hang onto a UI ready value + an old block ID we should delete if we save
export interface ActiveNote extends Note {
  refBlock?: string
  saved?: boolean
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
    case getType(actions.saveNoteSuccess): {
      if (!state.activeNote) {
        return state
      }
      return {...state, activeNote: {...state.activeNote, saved: true}}
    }
    case getType(actions.updateActiveNote): {
      // Simply update our ActiveNote without any sync to Textile
      const { value } = action.payload

      const updated = (new Date()).getTime()
      const json = value.toJSON() as ValueJSON
      // const texts = value.document.getBlocks().find((block?: Block) => block && block.text !== '' ? true : false)
      // const text = texts && texts.text !== '' ? texts.text : 'Note from ' + moment().format('ddd, h:mm a')
      const text = value.document.getBlocks().map((block?: Block) => {
        if (!block) { return '\n' }
        return `${block.text}\n`
      }).join()

      if (state.activeNote) {
        const refBlock = state.activeNote.block ? state.activeNote.block : state.activeNote.refBlock
        return {...state, activeNote: {
          ...state.activeNote,
          value: json,
          saved: false,
          block: undefined,
          text,
          updated,
          refBlock
        }}
      }

      const key = Md5.hashStr(JSON.stringify(json)).toString()
      return {...state, activeNote: {
        value: json,
        key: key + String(updated),
        created: updated,
        updated,
        text
      }}
    }
    case getType(actions.addOrUpdate): {
      const { note } = action.payload
      const exists = state.notes.find((n) => n.key === note.key)
      const final = !exists || note.updated > exists.updated ? note : {...exists, block: note.block}

      const notes = state.notes.filter((n) => n.key !== final.key)
      notes.push(final)

      const activeNote = state.activeNote
      if (activeNote && activeNote.key === final.key) {
        activeNote.block = final.block
      }

      return {...state, notes, activeNote}
    }
    case getType(actions.linkBlockToNote): {
      const { key, block } = action.payload
      const updatedNotes = state.notes.map((existing) => {
        if (key === existing.key) {
          return {...existing, block}
        }
        return existing
      })
      return {
        ...state,
        notes: updatedNotes,
        activeNote: state.activeNote && state.activeNote.key === key ? {...state.activeNote, block} : state.activeNote
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
      return {...state, activeNote: {...note, refBlock: note.block, saved: true}}
    }
    case getType(actions.setNotes): {
      return {
        ...state,
        notes: action.payload.notes
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
