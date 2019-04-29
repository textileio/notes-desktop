import * as React from 'react'
import './Styles/Styles.css'

interface NoteEditorState {
  width: number,
  height: number
}

interface ScreenProps {
  note: string
  onChange: (text: string) => void
}

class NoteEditor extends React.Component<ScreenProps> {
  state: NoteEditorState = { width: 0, height: 0 }

  textarea?: HTMLTextAreaElement

  constructor(props: any) {
    super(props)
    this.updateWindowDimensions = this.updateWindowDimensions.bind(this)
  }

  componentDidMount() {
    this.updateWindowDimensions()
    window.addEventListener('resize', this.updateWindowDimensions)
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.updateWindowDimensions)
  }

  updateWindowDimensions() {
    this.setState({ width: window.innerWidth, height: window.innerHeight })
  }

  noteChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    this.props.onChange(event.target.value)
  }

  public focus() {
    if (this.textarea) {
      this.textarea.focus()
    }
  }
  public render(): React.ReactNode {
    const areaStyle = {
      width: '96vw', 
      maxWidth: 745,
      height: '90%',  
      resize: 'none' as 'none', 
      padding: '2vw', 
      border: 'none' 
    }
    return (
      <div>
        <textarea
          ref={(input) => {
            this.textarea = input || undefined
          }}
          className={'text'}
          style={areaStyle}
          value={this.props.note}
          onChange={this.noteChange}
        />
      </div>
    )
  }
}

export default NoteEditor
