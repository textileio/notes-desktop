import * as React from 'react'
import { Value } from 'slate'
import NoteArea from './NoteArea'
import './Styles/Styles.css'


// Create our initial value...
const initialValue = Value.fromJSON({
  //@ts-ignore
  document: {
    nodes: [
      {
        object: 'block',
        type: 'paragraph',
        nodes: [
          {
            object: 'text',
            leaves: [
              {
                text: 'A line of text in a paragraph.',
              },
            ],
          },
        ],
      },
    ],
  },
})

interface NoteEditorState {
  value: any,
  width: number,
  height: number
}

interface ScreenProps {
  note?: any
  onChange?: any
  style?: any
}

class NoteEditor extends React.Component<ScreenProps> {
  state: NoteEditorState = { value: initialValue, width: 0, height: 0 }

  notearea?: NoteArea

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
    // this.props.onChange(event.target.value)
  }

  // On change, update the app's React state with the new editor value.
  onChange = (event: any) => {
    this.setState({ value: event.value })
  }
  
  public focus() {
    if (this.notearea) {
    }
  }

//   <textarea
//   ref={(input) => {
//     this.textarea = input || undefined
//   }}
//   className={'text'}
//   style={areaStyle}
//   value={this.props.note}
//   onChange={this.noteChange}
// />
// <Editor style={areaStyle} value={this.state.value} onChange={this.onChange} />
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
        demo
      </div>
    )
  }
}

export default NoteEditor
