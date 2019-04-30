import * as React from 'react'
import { connect } from 'react-redux'
import Modal from 'react-modal'

import { AppState } from '../Redux/Redux'
import { RootState } from '../Redux/Types'
import Textile from '@textile/js-http-client'

//@ts-ignore
import QRCode from 'qrcode.react'
import './Styles/Styles.css'


interface ScreenProps {
  isOpen: boolean
  onDismiss: () => void
  style?: Modal.Styles
}

type Props = UIProps & ScreenProps
class QRCodeInvite extends React.Component<Props> {
  state = {
    seed: undefined
  }
  componentDidMount = () => {
    try {
      const options = {
        url: '127.0.0.1',
        port: 40602
      }
      const textile = new Textile(options)
      textile.account.seed().then((seed) => {
        this.setState({seed: seed})
      })
    } catch (error) {
      console.info('ERROR - ', error)
    }
  }

  renderQR = () => {
    if (!this.state.seed) {
      return
    }
    const url = `textileNotes://textile.io/#${this.state.seed}`
    return (
      <QRCode style={{alignSelf: 'center'}} value='url' />
    )
  }
  render () {
    const el = document.getElementById('main') || {}
    return (
      <Modal
        appElement={el}
        isOpen={this.props.isOpen}
        style={this.props.style}
        contentLabel={'pair'}
      >
        <div style={{flex: 1, flexDirection: 'column', maxWidth: 300, alignContent: 'center', justifyContent: 'center'}}>
          <div className={'text'} style={{overflow: 'wrap', textAlign: 'center'}}>
            Install <a href="https://medium.com/textileio/textile-notes-a-minimalist-tool-for-your-creative-ideas-68b9357d5cd0" target="_blank" >Textile Notes</a> on your mobile phone. After successfully installing and onboarding, point your phone's native camera at the QR code below.
          </div>
          <div style={{padding: 20, display: 'flex', flex: 1, flexDirection: 'row', alignContent: 'center', justifyContent: 'center'}}>
            {this.renderQR()}
          </div>
          <div style={{display: 'flex', justifyContent: 'center', paddingTop: 15, cursor: 'pointer'}}>
            <a className={'header'} style={{color: '#2935ff'}} onClick={this.props.onDismiss}>Dismiss</a>
          </div>
        </div>
      </Modal>
    )
  }
}

interface UIProps {
  inviteURL: string
}

const mapStateToProps = (state: RootState): UIProps => {
  return {
    inviteURL: 'https://textile.io/'
  }
}


export default connect(mapStateToProps, undefined)(QRCodeInvite)