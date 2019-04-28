import { call, put, delay, takeLatest, all, fork, select, take, race } from 'redux-saga/effects'
import AppActions, { AppSelectors, Note } from './Redux'
import { ActionType } from 'typesafe-actions'
import Textile, { ApiOptions, ThreadList, Thread, FileIndex, FilesList, File, ThreadFiles } from '@textile/js-http-client'
import Files from '@textile/js-http-client/dist/modules/files';

const notesAppKey = 'io.textile.notes_desktop_primary_v0'

const notesSchema = {
  "name": "note",
  "mill": "/json",
  "json_schema": {
    "definitions": {},
    "$schema": "http://json-schema.org/draft-07/schema#",
    "$id": "http://example.com/root.json",
    "type": "object",
    "title": "",
    "required": ["text", "key", "created", "updated"],
    "properties": {
      "text": {
        "type": "string",
      },
      "key": {
        "type": "string",
      },
      "created": {
        "type": "integer",
      },
      "updated": {
        "type": "integer",
      }
    }
  }
}

const options: ApiOptions = {
  url: '127.0.0.1',
  port: 40602
}
const textile = new Textile(options)

const rootSaga = function* root() {
  yield all([
    fork(initTextile),
    fork(getDisplayNameRequest),
    fork(createOrUpdateThread),
    fork(saveNote),
    fork(deleteNote),
    fork(connectionPolling)
  ])
}


function* initTextile() {
  yield takeLatest('app/Startup', initTextileSaga)
}
function* getDisplayNameRequest() {
  yield takeLatest('app/GetDislpayName', getDislpayNameSaga)
}
function* deleteNote() {
  yield takeLatest('app/DeleteNote', deleteNoteSaga)
}
function* saveNote() {
  yield takeLatest('app/SaveNote', saveNoteSaga)
}
function* createOrUpdateThread() {
  yield takeLatest('app/CreateOrUpdateThread', createOrUpdateThreadSaga)
}

// MARK - Start of core Sagas

// Initialize all our Textile based data & connection
function * initTextileSaga() {
  try {
    const address = yield call([textile.account, 'address'])
    console.info('INFO - Textile connection success')
    console.info(`INFO - ${address}`)
    yield put(AppActions.startupSuccess())
    yield put(AppActions.getDisplayName())
    yield put(AppActions.createOrUpdateThread())
  } catch (error) {
    console.info('INFO - Textile connection failure')
    yield put(AppActions.connectionFailure())
  }
}

// Update the display name string
function * getDislpayNameSaga() {
  try {
    const name = yield call([textile.profile, 'name'])
    yield put(AppActions.setDisplayName(name))
  } catch(error) {
    yield put(AppActions.connectionFailure())
  }
}

// User requested note deletion
function* deleteNoteSaga(action: ActionType<typeof AppActions.deleteNote>) {
  const activeNote = yield select(AppSelectors.activeNote)
  if (activeNote && activeNote.block) {
    yield call(removeBlock, activeNote.block)
  }
  yield put(AppActions.deleteNoteSuccess())
}

// User requested note save or update
function* saveNoteSaga(action: ActionType<typeof AppActions.saveNote>) {
  const notes: Note[] = yield select(AppSelectors.notes)
  const activeNote = yield select(AppSelectors.activeNote)

  const updated = (new Date).getTime()

  // Update our existing note
  if (activeNote) {
    const updatedNote = {
      ...activeNote,
      text: action.payload.note,
      updated,
      block: undefined
    }

    const updatedNotes = [...notes.filter((note) => note.key !== updatedNote.key), updatedNote]

    // Keep the note selected by updating activeNote
    if (action.payload.select) {
      yield put(AppActions.setNotes(updatedNotes, updatedNote))
    } else {
      yield put(AppActions.setNotes(updatedNotes, undefined))
    }
    yield call(addNoteToThread, updatedNote)

    // Remove our old record
    if (activeNote.block) {
      yield call(removeBlock, activeNote.block)
    }
  } else {
    // Add the new note
    const created = updated
    const newNote = {
      key: action.payload.note + String(created),
      text: action.payload.note,
      created,
      updated
    }
    const updatedNotes = [...notes, newNote]
    // if it should be selected, make it the activeNote
    if (action.payload.select) {
      yield put(AppActions.setNotes(updatedNotes, newNote))
    } else {
      yield put(AppActions.setNotes(updatedNotes, undefined))
    }
    yield call(addNoteToThread, newNote)
  }
}

function * createOrUpdateThreadSaga() {
  try {
    const threads: ThreadList = yield call([textile.threads, 'list'])
    const appThread = threads.items.filter((thread: Thread) => thread.key === notesAppKey)
    if (appThread.length) {
      // store app thread
      console.info('INFO -- existing app thread found')
      yield put(AppActions.setThreadId(appThread[0].id))
      yield call(refreshStoredNotes, appThread[0].id)
    } else {
      console.info('INFO -- initializing app thread')
      const newSchema: FileIndex = yield call([textile.schemas, 'add'], notesSchema)
      const newThread = yield call([textile.threads, 'add'], 'textile-pages-desktop', newSchema.hash, notesAppKey)
      yield put(AppActions.setThreadId(newThread.id))
      yield call(refreshStoredNotes, newThread.id)
    }
  } catch(error) {
    console.log(error)
    yield put(AppActions.connectionFailure())
  }
}

// Mark - Async methods to help Sagas

// Notifies that the Redux notes or removals are unsynced to the thread
function * markUnsynced() {
  // Assume it's because of a connection failure for now
  yield put(AppActions.connectionFailure())
  yield put(AppActions.markOutOfDate())
}

// Grabs any unsynced delete requests and runs them through Textile
function* removePendingBlocks() {
  let next = yield select(AppSelectors.selectPendingDelete)
  while (next) {
    const syncing = yield select(AppSelectors.connected)
    if (!syncing) {
      // app not connected, don't bother trying
      yield put(AppActions.markOutOfDate())
      next = undefined
      continue
    }
    yield call(removeBlock, next)
    const success = yield put(AppActions.syncDeleteSuccess(next))
    if (!success) {
      // app not connected, don't bother trying
      yield put(AppActions.markOutOfDate())
      next = undefined
      continue
    }
    next = yield select(AppSelectors.selectPendingDelete)
  }
}

// Runs the remove block request against Textile
function * removeBlock(block: string) {
  try {
    yield call([textile.blocks, 'remove'], block)
  } catch (error) {
    yield call(markUnsynced)
    yield put(AppActions.deleteNoteFailure(block))
  }
}

// Converts the Redux note to a json payload to store in our Thread
function * addNoteToThread(note: Note) {

  const appThreadId = yield select(AppSelectors.appThreadId)

  const payload = {
    "text": note.text,
    "key": note.key,
    "created": note.created,
    "updated": note.updated
  }
  try {
    const result = yield call([textile.files, 'addFile'], JSON.stringify(payload), '', appThreadId)
    // Link our redux stored note with the block in our thread (will match later reads directly from thread)
    yield put(AppActions.linkBlockToNote(note, result.block))    
  } catch (error) {
    yield call(markUnsynced)
  }
}

// Gets raw note data from Thread
function * fetchNoteFromFile(entry: any) {
  const { block, files } = entry
  const fileData = yield call([textile.files, 'fileData'], files[0].file.hash)
  const note = JSON.parse(fileData)
  return {...note, block}
}

// Combines current Redux with stored Thread state to get latest Notes on startup
function * refreshStoredNotes(threadId: string) {
  const reduxNotes = yield select(AppSelectors.notes, true)

  // ensure any of our unstored notes get stored
  if (reduxNotes.length) {
    for (const note of reduxNotes) {
      if (!note.block) {
        yield call(addNoteToThread, note)
      }
    }
  }

  yield call(removePendingBlocks)

  // grab the full set from the thread
  const noteEntries: FilesList = yield call([textile.files, 'list'], threadId, '', 100)
  for (const file of noteEntries.items) {
    const note = yield call(fetchNoteFromFile, file)
    yield put(AppActions.addOrUpdate(note))
  }

  const pendingDelete = yield select(AppSelectors.selectPendingDelete)
  if (!pendingDelete) {
    yield put(AppActions.markSynced())
  }
}

// Our polling job just to see if we can get a response from the local api
// If we do, try the startup sequence again
function* checkTextileConnection() {
  let connected = yield select(AppSelectors.connected)
  while (!connected) {
    yield delay(5000)
    connected = yield select(AppSelectors.connected)
    if (!connected) {
      try {
        // test the connection
        yield call([textile.account, 'address'])
        // if it passes, try startup
        yield put(AppActions.startup())
      } catch (error) {
        console.info('ERROR --', error.message)
      }
    }
  }
}

// if ConnectionFailure gets called, begin a polling job unless StartupSuccess finishes
function* connectionPolling() {
  while (true) {
    yield take('app/ConnectionFailure')
    yield race([call(checkTextileConnection), take('app/StartupSuccess')])
  }
}

export default rootSaga;