import * as React from 'react'
import moment from 'moment'
import { Note } from '../Redux/Redux'
import './Styles/Styles.css'

interface ScreenProps {
  notes: Note[]
  selectNote: (note: Note) => void
  style?: React.CSSProperties
}
class NotesList extends React.Component<ScreenProps> {
  renderNote = (note: Note, index: number) => {
    const noteStyle: React.CSSProperties = {
      padding: 0,
      margin: 0,
      paddingTop: '1em',
      marginBottom: '1em',
      minHeight: '1.4em',
      maxHeight: '3.6em',
      lineHeight: '1.4em',
      overflow: 'hidden',
      cursor: 'pointer'
    }
    const timeStamp: React.CSSProperties = {
      width: '100%',
      minHeight: '1.4em',
      maxHeight: '3em',
      lineHeight: '1.4em',
      fontSize: '10px',
      color: 'rgba(255, 255, 255, 0.2)'
    }
    const timestamp = moment(note.updated).fromNow()
    const lines = note.text.split('\n')
    const target = lines.length ? lines[0] : ''
    return (
      <div className={'text'} onClick={() => {this.props.selectNote(note)}} style={noteStyle} key={note.key}>
        <div style={timeStamp}>{timestamp}</div>
        {target}
      </div>
    )
  }
  render(): React.ReactNode {
    const notesList = this.props.notes
      .sort((a: Note, b: Note) => a.updated < b.updated ? 1 : -1)
      .map((note: Note, index: number) => this.renderNote(note, index))
    return (
      <div style={this.props.style}>
        {notesList}
      </div>
    )
  }
}

export default NotesList
