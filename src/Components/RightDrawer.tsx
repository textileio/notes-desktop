import * as React from 'react'
import { connect } from 'react-redux'
import Modal from 'react-modal'

import { Note } from '../Redux/Redux'
import { RootState } from '../Redux/Types'

import Tooltip from '@material-ui/core/Tooltip'
import * as Icons from '@material-ui/icons'
import Drawer from './Drawer'
import NotesList from './NotesList'

import './Styles/Styles.css'

const buttonStyle = {background: '#2935ff', padding: 5, color: 'white', marginRight: 4, cursor: 'pointer'}

interface ScreenProps {
  isOpen: boolean
  name?: string
  width: string | undefined
  style: React.CSSProperties
  showQRCodeLink: boolean
  selectNote: (note: Note) => void
  onClose: () => void
  pairingRequest: () => void
  logout: () => void

}

const iconColor = 'rgba(255, 255, 255, 0.5)'
type Props = ScreenProps & UIProps
class RightDrawer extends React.Component<Props> {

  logoutLink = () => {
    return (
      <Tooltip title={'Clear local cache.'}>
        <Icons.PowerSettingsNew style={{...buttonStyle, background: 'none', color: iconColor}} onClick={this.props.logout} />
      </Tooltip>
    )
  }
  qrCodeLink = () => {
    if (!this.props.showQRCodeLink) {
      return (<div></div>)
    }
    return (
      <Tooltip title={'Pair with Textile mobile.'}>
        <Icons.MobileScreenShare style={{...buttonStyle, background: 'none', color: iconColor}} onClick={this.props.pairingRequest} />
      </Tooltip>
    )
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
          selectNote={this.props.selectNote}
        />

        <div style={{display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', zIndex: 1000}}>
          <div style={{display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start'}}>
            {this.logoutLink()}
            {this.qrCodeLink()}
          </div>
          <a href='https://textile.io' target='_blank' style={{display: 'flex', paddingTop: 10}}>
            <img src='https://gateway.textile.cafe/ipfs/QmarZwQEri4g2s8aw9CWKhxAzmg6rnLawGuSGYLSASEow6/0/d' width={30} height={30} />
          </a>
        </div>
      </div>
    )
  }

  public render(): React.ReactNode {
    return (
      <Drawer
        isOpen={ this.props.isOpen }
        from='right'
        width={ this.props.width }
        style={ this.props.style }
        onRequestClose={this.props.onClose}>
        {this.renderInnerDrawer()}
      </Drawer>
    )
  }
}

interface UIProps {
  notes: ReadonlyArray<Note>
}

const mapStateToProps = (state: RootState): UIProps => {
  return { notes: state.app.notes }
}

export default connect(mapStateToProps, undefined)(RightDrawer)
