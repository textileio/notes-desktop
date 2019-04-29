import React from 'react'
import ReactDOM from 'react-dom'
import * as Icons from '@material-ui/icons'
import styled from '@emotion/styled'
import { Editor, EditorProps, RenderMarkProps, RenderNodeProps } from 'slate-react'
import { Value } from 'slate'


const initialValue = Value.fromJSON({
  //@ts-ignore
  "document": {
    "nodes": [
      {
        "object": "block",
        "type": "paragraph",
        "nodes": [
          {
            "object": "text",
            "leaves": [
              {
                "text":
                  "This example shows how you can make a hovering menu appear above your content, which you can use to make text "
              },
              {
                "text": "bold",
                "marks": [
                  {
                    "type": "bold"
                  }
                ]
              },
              {
                "text": ", "
              },
              {
                "text": "italic",
                "marks": [
                  {
                    "type": "italic"
                  }
                ]
              },
              {
                "text": ", or anything else you might want to do!"
              }
            ]
          }
        ]
      },
      {
        "object": "block",
        "type": "paragraph",
        "nodes": [
          {
            "object": "text",
            "leaves": [
              {
                "text": "Try it out yourself! Just "
              },
              {
                "text": "select any piece of text and the menu will appear",
                "marks": [
                  {
                    "type": "bold"
                  },
                  {
                    "type": "italic"
                  }
                ]
              },
              {
                "text": "."
              }
            ]
          }
        ]
      }
    ]
  }
})

interface TextAreaProps {
  note?: Value
  onChange: (note: any) => void
  style?: React.CSSProperties
}

export interface EditorPropertiesInit extends Editor {
  value: Value
}
class NoteArea extends React.Component<TextAreaProps> {
  /**
   * Deserialize the raw initial value.
   *
   * @type {Object}
   */

  menu?: HTMLDivElement | null

  state = {
    value: initialValue
  }
  /**
   * On update, update the menu.
   */

  componentDidMount = () => {
    this.updateMenu()
  }

  componentDidUpdate = () => {
    this.updateMenu()
  }

  /**
   * Update the menu's absolute position.
   */

  updateMenu = () => {
    const menu = this.menu
    if (!menu) return

    const { value } = this.state
    console.log(value)
    const { fragment, selection } = value

    // avoids moving the menu after already open
    if (selection.isBlurred || selection.isCollapsed || fragment.text === '') {
      console.log(
        selection,
        selection.isBlurred, selection.isCollapsed, fragment.text
      )
      menu.removeAttribute('style')
      return
    }

    const native = window.getSelection()
    const range = native && native.getRangeAt(0)
    const rect = range ? range.getBoundingClientRect() : {top: 10, left: 10, width: 100}
    menu.style.opacity = '1'
    menu.style.top = `${rect.top - 60}px` //`${rect.top + window.pageYOffset - 100}px`
    menu.style.height = `46px`
    menu.style.left = `${rect.left +
      window.pageXOffset -
      menu.offsetWidth / 2 +
      rect.width / 2}px`
    console.log(menu.style)
  }

  /**
   * Render.
   *
   * @return {Element}
   */

  render() {
    return (
      <div>
        <Editor
          placeholder="Enter some text..."
          value={this.state.value}
          onChange={this.props.onChange}
          renderNode={this.renderNode}
          renderEditor={this.renderEditor}
          renderMark={this.renderMark}
          style={this.props.style}
        />
      </div>
    )
  }


  renderNode = (props: RenderNodeProps, editor: any, next: () => any) => {
    const { attributes, children, node } = props
    switch (node.type) {
      case 'heading':
        return <h1 {...attributes}>{children}</h1>
      case 'numbered-list':
        return <ol {...attributes} >{children}</ol>
      case 'list-item':
        return (
            <li
                {...props.attributes}
            >
                {props.children}
            </li>
        )
      default:
        return next()
    }
  }
  /**
   * Render the editor.
   *
   * @param {Object} props
   * @param {Function} next
   * @return {Element}
   */

  renderEditor = (props: EditorProps, editor: any, next: () => any): Element | any => {
    const children = next()
    return (
      <React.Fragment>
        {children}
        <EditorMenu innerRef={(menu: HTMLDivElement | null) => {
          this.menu = menu
        }} editor={editor} />
      </React.Fragment>
    )
  }

  renderMark = (props: RenderMarkProps, editor: any, next: () => any) => {
    const { children, mark, attributes } = props

    switch (mark.type) {
      case 'bold':
        return <strong {...attributes}>{children}</strong>
      case 'code':
        return <code {...attributes}>{children}</code>
      case 'italic':
        return <em {...attributes}>{children}</em>
      case 'underlined':
        return <u {...attributes}>{children}</u>
      default:
        return next()
    }
  }
}


export const Menu = styled('div')`
  & > * {
    display: inline-block;
  }
  & > * + * {
    margin-left: 15px;
  }
`
const StyledMenu = styled(Menu)`
  position: absolute;
  z-index: 1000;
  top: -10000px;
  left: -10000px;
  opacity: 0;
  background-color: #fff;
  border: 1px solid #AAA;
  border-radius: 4px;
  display: flex;
  flex-direction: row;
  align-content: space-between;
  justify-content: space-between;
  height: 184px;
  transition: opacity 0.75s;
`

interface ScreenProps {
  editor: any
  innerRef: (ref: HTMLDivElement | null) => void
  style?: React.CSSProperties
}
class EditorMenu extends React.Component<ScreenProps> {

 onClickMark = (event: any, type: string) => {
   //@ts-ignore
   const { editor } = this.props
   event.preventDefault()
   editor.toggleMark(type)
 }

 getIcon = (icon: string, isActive?: boolean, onMouseDown?: (event: React.MouseEvent) => void) => {
   const iconStyle: React.CSSProperties = {
     border: isActive ? '1px solid rgba(0,0,0,0.2)' : '1px solid #FFF',
     borderRadius: 4,
     padding: 10,
     margin: 2,
     fontSize: 20,
     color: 'black',
     zIndex: 10001
   }
   switch(icon) {
     case 'format_heading': 
       return (
         <Icons.FormatSize style={iconStyle} onMouseDown={onMouseDown}/>
       )
     case 'format_bold': 
       return (
         <Icons.FormatBold style={iconStyle} onMouseDown={onMouseDown}/>
       )
     case 'format_italic': 
       return (
         <Icons.FormatItalic style={iconStyle}  onMouseDown={onMouseDown}/>
       )
     case 'format_underlined': 
       return (
         <Icons.FormatUnderlined style={iconStyle} onMouseDown={onMouseDown} />
       )
     case 'code': 
       return (
         <Icons.Code style={iconStyle} onMouseDown={onMouseDown} />
       )
     case 'format_list_numbered': 
       return (
         <Icons.FormatListNumbered style={iconStyle} onMouseDown={onMouseDown} />
       )
   }
 }
 renderMarkButton = (type: string, icon: string) => {
   //@ts-ignore
   const { editor } = this.props
   const { value } = editor
   const isActive = value.activeMarks.some((mark: any) => mark.type === type)
   return this.getIcon(icon, isActive, (event) => { this.onClickMark(event, type) })
 }

 onClickBlock = (event: React.MouseEvent, type: string) => {
   event.preventDefault()

   const { editor } = this.props
   const { value } = editor
   const { document } = value

   // Handle everything but list buttons.
   if (type !== 'bulleted-list' && type !== 'numbered-list') {
     const isActive = this.hasBlock(type)
     editor.setBlocks(isActive ? 'paragraph' : type)
   } else {
     // Handle the extra wrapping required for list buttons.
     const isList = this.hasBlock('list-item')
     const isType = value.blocks.some((block: any) => {
       return !!document.getClosest(block.key, (parent: any) => parent.type === type)
     })

     if (isList && isType) {
       editor
         .setBlocks('paragraph')
         .unwrapBlock('bulleted-list')
         .unwrapBlock('numbered-list')
     } else if (isList) {
       editor
         .unwrapBlock(
           type === 'bulleted-list' ? 'numbered-list' : 'bulleted-list'
         )
         .wrapBlock(type)
     } else {
       editor.setBlocks('list-item').wrapBlock(type)
     }
   }
 }

 hasBlock = (type: string) => {
   const { editor } = this.props
   const { value } = editor
   return value.blocks.some((node: any) => node.type === type)
 }
 renderBlockButton = (type: string, icon: string) => {
   let isActive = this.hasBlock(type)

   // TODO: Add bulleted lists support
   // see: https://github.com/ianstormtaylor/slate/blob/master/examples/rich-text/index.js
   if (['numbered-list', 'bulleted-list'].includes(type)) {
     const { editor } = this.props
     const { value } = editor
     const { document, blocks } = value

     if (blocks.size > 0) {
       const parent = document.getParent(blocks.first().key)
       //@ts-ignore
       isActive = this.hasBlock('list-item') && parent && parent.type === type
     }
   }

   return this.getIcon(icon, isActive, (event) => { this.onClickBlock(event, type) })
 }

 render() {
   const { innerRef } = this.props
   const root = window.document.getElementById('main')

   return ReactDOM.createPortal(
     <StyledMenu ref={innerRef}>
       {this.renderBlockButton('heading', 'format_heading')}
       {this.renderMarkButton('bold', 'format_bold')}
       {this.renderMarkButton('italic', 'format_italic')}
       {this.renderMarkButton('underlined', 'format_underlined')}
       {this.renderMarkButton('code', 'code')}
       {this.renderBlockButton('numbered-list', 'format_list_numbered')}
     </StyledMenu>,
     //@ts-ignore
     root
   )
 }
}

export default NoteArea