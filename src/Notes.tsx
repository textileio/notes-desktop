import * as React from 'react'
import { Dispatch } from 'redux'
import { connect } from 'react-redux'
import Modal from 'react-modal'
import hotkeys from 'hotkeys-js'

import AppActions, { AppState, Note } from './Redux/Redux'
import { RootState, RootAction } from './Redux/Types'

import Tooltip from '@material-ui/core/Tooltip'
import * as Icons from '@material-ui/icons'
import Drawer from './Components/Drawer'
import NotesList from './Components/NotesList'
import NoteArea from './Components/NoteArea'
import Menu from './Components/Menu'

import { Value, SchemaProperties } from 'slate'

import './Components/Styles/Styles.css'

const menuStyle = {background: '#2935ff', color: 'white', display: 'flex'}
const areaStyle = {width: '96vw', maxWidth: '100%', padding: '2vw' }
const buttonStyle = {background: '#2935ff', padding: 5, color: 'white', marginRight: 4, cursor: 'pointer'}
const modalStyle: Modal.Styles = {
  content : {
    top                   : '50%',
    left                  : '50%',
    right                 : 'auto',
    bottom                : 'auto',
    marginRight           : '-50%',
    transform             : 'translate(-50%, -50%)'
  }
}

const defaultValue = Value.fromJSON({
  "object": "value",
  "document": {
    "object": "document",
    "data": {},
    "nodes": [
      {
        "object": "block",
        "type": "paragraph",
        "data": {},
        "nodes": [
          {
            "object": "text",
            "leaves": [
              {
                "object": "leaf",
                "text": "",
                "marks": []
              }
            ]
          }
        ]
      }
    ]
  }
})


interface ComponentState {
  runInOfflineMode: boolean
  isDrawerOpen: boolean
  width: number
  height: number
  update: number
  currentNote?: Value
}

type Props = ScreenDispatch & UIProps
class NotesApp extends React.Component<Props> {

  state: ComponentState = {
    runInOfflineMode: false,
    isDrawerOpen: true,
    width: 0,
    height: 0,
    update: 0
  }

  componentDidUpdate(prevProps: Props) {
    console.log(this.state.currentNote)
    if (!this.state.currentNote && this.props.activeNote && this.props.activeNote.value) {
      this.setState({currentNote: Value.fromJSON(this.props.activeNote.value)})
    }
  }
  componentDidMount() {
    this.updateWindowDimensions()
    window.addEventListener('resize', this.updateWindowDimensions)
  }

  componentWillUnmount = () => {
    window.removeEventListener('resize', this.updateWindowDimensions)
  }

  updateWindowDimensions = () => {
    this.setState({ width: window.innerWidth, height: window.innerHeight })
  }
  
  updateCurrentNote = (currentNote: Value) => {
    console.log(currentNote)
    console.log(currentNote === defaultValue)
    this.props.updateCurrentNote(currentNote)
    this.setState({currentNote: currentNote })
  }

  toggleDrawer = () => {
    const focusText = this.state.isDrawerOpen
    this.setState({
      isDrawerOpen: !this.state.isDrawerOpen
    })
  }
  selectNote = (note: Note) => {
    this.setState({currentNote: Value.fromJSON(note.value)})
    this.props.selectNote(note)
    this.toggleDrawer()
  }
  clearNote = () => {
    this.props.clearNote()
    this.setState({currentNote: defaultValue, isDrawerOpen: false})
  }
  saveAndSelectNote = () => {
    if (this.props.requiresSave) {
      this.props.saveNote()
      this.setState({isDrawerOpen: false})
    }
  }

  deleteNote = () => {
    this.props.deleteNote()
    setTimeout(() => {
      // ActiveNote wont get cleared for a moment, so just needs to wait for a second
      this.setState({currentNote: defaultValue, isDrawerOpen: false})
    }, 500)
  }

  logout = () => {
    this.props.logout()
    this.setState({currentNote: defaultValue})
  }

  renderInnerDrawer = () => {
    const displayName = this.props.name && this.props.name !== '' ? this.props.name : 'Disconnected'
    return (
      <div style={{display: 'flex', flex: 1, height: '100%', flexDirection: 'column'}}>

        <div style={{display: 'flex', paddingBottom: 10}}>
          <div className={'text'} style={{flex: 1, marginLeft: 20, color: '#9492de', textAlign: 'right'}}>{displayName}</div>
        </div>

        <NotesList
          style={{flex: 1, paddingTop: 20}}
          notes={this.props.notes.map((note) => note)}      
          selectNote={this.selectNote}        
        />

        <a href="https://textile.io" target="_blank" style={{display: 'flex', paddingTop: 10, alignItems: 'flex-end', justifyContent: 'flex-end'}}>
          <img src="https://gateway.textile.cafe/ipfs/QmarZwQEri4g2s8aw9CWKhxAzmg6rnLawGuSGYLSASEow6/0/d" width={30} height={30} />
        </a>
      </div>
    )
  }

  syncWarning = () => {
    if (this.props.showSyncIssue) {
      return (
        <div style={{display: 'flex', flexDirection: 'row', margin: 0}}>
          <div style={{...areaStyle, zIndex: 100}} >
            <Tooltip title={'Unable to reach your Textile account.'}>
              <Icons.SyncProblem style={{...buttonStyle, background: 'none', color: 'gray', zIndex: 100}} />
            </Tooltip>
          </div>
        </div>
      )
    }
    return
  }


  ejectButton = () => {
    return (
      <Tooltip title={'Clear Session'}>
        <Icons.Eject onClick={this.logout} style={buttonStyle} />
      </Tooltip>
    )
  }

  getNotePad = () => {
    const displayValue = this.state.currentNote || defaultValue
    const textAreaStyle = {
      width: '96vw', 
      maxWidth: 745,
      fontSize: 18,
      height: '90%',  
      resize: 'none' as 'none', 
      padding: '2vw', 
      border: 'none' 
    }
    return (
      <div>
        <NoteArea
          value={displayValue}
          onChange={this.updateCurrentNote}
          style={textAreaStyle}
        />
      </div>
    )
  }
  public render(): React.ReactNode {

    const el = document.getElementById('main') || {}

    const menuWidth = this.state.width > 1000 ? '30%' : '300px'

    return (
      <div style={{display: 'flex', flexDirection: 'column', padding: 0, margin: 0}}>

        <div style={{display: 'flex', flexDirection: 'row', margin: 0, zIndex: 100}}>
          <Menu
            style={areaStyle}
            buttonStyle={buttonStyle}
            requiresSave={this.props.requiresSave}
            saveAndSelectNote={this.saveAndSelectNote}
            toggleDrawer={this.toggleDrawer}
            clearNote={this.clearNote}
            deleteNote={this.deleteNote}
            showSyncIssue={this.props.showSyncIssue}
          />
        </div>

        <div style={{display: 'flex', flex: 1, justifyContent: 'center', alignContent: 'center', overflow: 'scroll' }}>
          {this.getNotePad()}
        </div>

        <div>
          <Drawer
            isOpen={ this.state.isDrawerOpen }
            from='right'
            width={menuWidth}
            style={menuStyle}
            onRequestClose={ () => {
                this.setState({ isDrawerOpen: false })
            } }>
            {this.renderInnerDrawer()}
          </Drawer>

          {this.syncWarning()}

        </div> 
        <Modal
          appElement={el}
          isOpen={this.props.showModal && !this.state.runInOfflineMode}
          style={modalStyle}
          contentLabel={'Welcome'}
        >
          <div style={{flex: 1}}>
              <a href="https://textile.io" target="_blank" style={{paddingBottom: 15}}>
                  <img src="https://gateway.textile.cafe/ipfs/QmarZwQEri4g2s8aw9CWKhxAzmg6rnLawGuSGYLSASEow6/0/d" width={30} height={30} />
              </a>
              <div style={{maxWidth: 420} }>
                <p className={'text'} dangerouslySetInnerHTML={{__html: this.props.modalText}} />
              </div>
              <div style={{display: 'flex', justifyContent: 'center', paddingTop: 15, cursor: 'pointer'}}>
                <a className={'header'} style={{color: '#2935ff'}} onClick={() => { this.setState({runInOfflineMode: true}) }}>Ignore</a>
              </div>
          </div>
        </Modal>
      </div>
    )
  }
}

interface UIProps extends AppState {
  showSyncIssue: boolean
  showModal: boolean
  modalText: string
  requiresSave: boolean
}

const mapStateToProps = (state: RootState): UIProps => {
  const showSyncIssue = state.app.connection === 'failure' 
  let showModal = false
  let modalText = ''
  if (state.app.connection === 'failure' && state.app.sessions === 0) {
    modalText = 'To run the Notes app, you first need to setup your Textile account on your computer. To get started, head over to the <a target="_blank" href="https://docs.textile.io/install/desktop/">setup instructions</a>. Click ignore to run in offline mode.'
    showModal = true
  } 
  const requiresSave = state.app.activeNote && !state.app.activeNote.saved || false
  return { ...state.app, modalText, showModal, showSyncIssue, requiresSave }
}

interface ScreenDispatch {
  updateCurrentNote:  (currentNote: Value) => void
  saveNote: () => void
  selectNote: (note: Note) => void
  clearNote: () => void
  deleteNote: () => void
  logout: () => void
}
const mapDispatchToProps = (dispatch: Dispatch<RootAction>): ScreenDispatch => {
  return {
    updateCurrentNote: (currentNote: Value) => dispatch(AppActions.updateActiveNote(currentNote)),
    selectNote: (note: Note) => dispatch(AppActions.selectNote(note)),
    saveNote: () => dispatch(AppActions.saveNote()),
    clearNote: () => dispatch(AppActions.clearNote()),
    deleteNote: () => dispatch(AppActions.deleteNote()),
    logout: () => dispatch(AppActions.logout())
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(NotesApp)