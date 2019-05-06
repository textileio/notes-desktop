// Credit https://github.com/DimitryDushkin/sliding-pane
import * as React from 'react'
import Modal from 'react-modal'

import './Styles/DrawerStyles.css'

const CLOSE_TIMEOUT = 500

interface ScreenProps {
  isOpen: boolean
  children: any
  onRequestClose?: () => void
  onAfterOpen?: () => void
  className?: string
  overlayClassName?: string
  from?: 'left' | 'right' | 'bottom'
  width?: string
  closeIcon?: any
  style?: any
}
export default class SlidingMenu extends React.Component<ScreenProps, object> {
  public render() {
    const { children, className, from, isOpen, onAfterOpen, onRequestClose, overlayClassName, style, width } = this.props
    const dfrom = from || 'right'
    const directionClass = `slide-pane_from_${dfrom}`
    const modalStyle = { ...style, width: width || '80%' }
    const el = document.getElementById('app') || {}
    return (
      <Modal
        appElement={el}
        className={ `slide-pane ${directionClass} ${className || ''}` }
        style={{
            content: modalStyle
        }}
        // add back to dim non covered areas
        // overlayClassName={ `slide-pane__overlay ${overlayClassName || ''}`}
        closeTimeoutMS={ CLOSE_TIMEOUT }
        isOpen={ isOpen }
        onAfterOpen={ onAfterOpen }
        onRequestClose={ onRequestClose }
      >
        <div className='slide-pane__content'>
            { children }
        </div>
    </Modal>
    )
  }
}
