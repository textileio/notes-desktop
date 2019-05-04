import { call, put, delay, takeLatest, all, fork, select, take, race } from 'redux-saga/effects'
import AppActions, { AppSelectors, Note } from './Redux'
import { ActionType } from 'typesafe-actions'
import textile, { ThreadList, Thread, FileIndex, FilesList } from '@textile/js-http-client'

const notesAppKey = 'io.textile.notes_desktop_primary_v1'

const notesSchema = {
  name: 'io.textile.notes_primary_v0.0.1',
  mill: '/json',
  json_schema: {
    definitions: {},
    $schema: 'http://json-schema.org/draft-07/schema#',
    $id: 'http://example.com/root.json',
    type: 'object',
    title: '',
    required: ['key', 'text', 'value', 'updated', 'created'],
    properties: {
      key: {
        type: 'string'
      },
      text: {
        type: 'string'
      },
      value: {
        type: 'object'
      },
      updated: {
        type: 'integer'
      },
      created: {
        type: 'integer'
      }
    }
  }
}

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
    yield put(AppActions.getDisplayName())
    yield put(AppActions.createOrUpdateThread())
  } catch (error) {
    console.error('ERROR -- Textile connection failure')
    yield put(AppActions.connectionFailure())
  }
}

// Update the display name string
function * getDislpayNameSaga() {
  try {
    const name = yield call([textile.profile, 'name'])
    yield put(AppActions.setDisplayName(name))
  } catch (error) {
    console.error('ERROR --', error)
    yield put(AppActions.connectionFailure())
  }
}

// User requested note deletion
function* deleteNoteSaga(action: ActionType<typeof AppActions.deleteNote>) {
  const activeNote = yield select(AppSelectors.activeNote)
  if (activeNote && activeNote.block) {
    yield call(removeBlock, activeNote.block)
  }
  if (activeNote && activeNote.refBlock) {
    yield call(removeBlock, activeNote.refBlock)
  }
  yield put(AppActions.deleteNoteSuccess())
}

// User requested note save or update
function* saveNoteSaga(action: ActionType<typeof AppActions.saveNote>) {
  const notes: Note[] = yield select(AppSelectors.notes)
  const activeNote = yield select(AppSelectors.activeNote)

  const updatedNotes = [...notes.filter((note) => note.key !== activeNote.key), activeNote]
  yield put(AppActions.setNotes(updatedNotes))

  if (activeNote.refBlock) {
    yield call(removeBlock, activeNote.refBlock)
  }
  yield call(addNoteToThread, activeNote)
  yield put(AppActions.saveNoteSuccess())
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
      yield put(AppActions.startupSuccess())
    }
  } catch (error) {
    console.error('ERROR --', error)
    yield put(AppActions.connectionFailure())
  }
}

// Mark - Async methods to help Sagas

// Notifies that the Redux notes or removals are unsynced to the thread
function * markUnsynced(type: string, error: Error) {
  // Assume it's because of a connection failure for now
  console.error(type, error.message)
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
    yield call(markUnsynced, 'removing block', error)
    yield put(AppActions.deleteNoteFailure(block))
  }
}

// Converts the Redux note to a json payload to store in our Thread
function * addNoteToThread(note: Note) {

  const appThreadId = yield select(AppSelectors.appThreadId)

  // TODO: Fix
  const payload = {
    key: note.key,
    text: note.text,
    created: note.created,
    updated: note.updated,
    value: note.value
  }
  try {
    const result = yield call([textile.files, 'add'], JSON.stringify(payload), '', appThreadId)
    // // Link our redux stored note with the block in our thread (will match later reads directly from thread)
    yield put(AppActions.linkBlockToNote(note.key, result.block))
  } catch (error) {
    yield call(markUnsynced, 'finalizing save', error)
  }
}

// Gets raw note data from Thread
function * fetchNoteFromFile(entry: any) {
  const { block, files } = entry
  const fileData = yield call([textile.file, 'content'], files[0].file.hash)
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

export default rootSaga
