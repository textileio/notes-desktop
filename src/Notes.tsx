import * as React from 'react'
import { Dispatch } from 'redux'
import { connect } from 'react-redux'
import Modal from 'react-modal'

import AppActions, { AppState, Note } from './Redux/Redux'
import { RootState, RootAction } from './Redux/Types'

import Tooltip from '@material-ui/core/Tooltip'
import * as Icons from '@material-ui/icons'
import Drawer from './Components/Drawer'
import NotesList from './Components/NotesList'
import NoteArea from './Components/NoteArea'
import Menu from './Components/Menu'
import QRCodeInvite from './Components/QRCodeInvite'
import RightDrawer from './Components/RightDrawer'

//@ts-ignore
import { Value } from 'slate'

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

export const defaultValue = Value.fromJSON({
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
  displayQRCode: boolean
}

type Props = ScreenDispatch & UIProps
class NotesApp extends React.Component<Props> {

  state: ComponentState = {
    displayQRCode: false,
    runInOfflineMode: false,
    isDrawerOpen: true,
    width: 0,
    height: 0,
    update: 0
  }

  componentDidUpdate(prevProps: Props) {
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
  displayQRCode = () => {
    this.setState({displayQRCode: true})
  }

  syncWarning = () => {
    if (this.props.showSyncIssue) {
      return (
        <Tooltip title={'Unable to reach your Textile account.'}>
          <Icons.SyncProblem style={{...buttonStyle, background: 'none', color: 'gray', zIndex: 2000}} />
        </Tooltip>
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
    if (!this.props.connection) {
      return
    }
    const displayValue = this.state.currentNote || 
      (this.props.activeNote && this.props.activeNote.value ? Value.fromJSON(this.props.activeNote.value) : defaultValue)

    const textAreaStyle = {
      width: '96vw', 
      maxWidth: 745,
      fontSize: 18,
      height: '90%',  
      resize: 'none' as 'none', 
      padding: '2vw', 
      border: 'none',
      color: '#2b2b2b'
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
        <div style={{display: 'flex', flexDirection: 'row', margin: 0, background: 'none'}}>
          <div style={{width: '96vw', maxWidth: '100%', paddingLeft: '2vw', paddingBottom: '2vw', background: 'none'}} >
              {this.syncWarning()}
          </div>
        </div>

        <div>
          <RightDrawer
            isOpen={this.state.isDrawerOpen}
            name={'display'}
            width={menuWidth}
            style={menuStyle}
            onClose={() => {
              this.setState({ isDrawerOpen: false })
            }}
            pairingRequest={this.displayQRCode}
            selectNote={this.selectNote}
          />
        </div> 
        
        <QRCodeInvite
          visible={!this.props.showSyncIssue}
          onDismiss={() => { this.setState({displayQRCode: false}) }}
          isOpen={this.state.displayQRCode}
          style={modalStyle}
        />

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