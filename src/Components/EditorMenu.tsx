import React from 'react'
import ReactDOM from 'react-dom'
import * as Icons from '@material-ui/icons'
import styled from '@emotion/styled'

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

interface EditorMenuProps {
  editor: any
  innerRef: (ref: HTMLDivElement | null) => void
  style?: React.CSSProperties
}
class EditorMenu extends React.Component<EditorMenuProps> {

 onClickMark = (event: any, type: string) => {
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
   switch (icon) {
     case 'format_heading_one':
       return (
         <Icons.FormatSize style={iconStyle} onMouseDown={onMouseDown}/>
       )
      case 'format_heading_two':
        return (
          <Icons.FormatSize style={{...iconStyle, fontSize: 14, lineHeight: 20}} onMouseDown={onMouseDown}/>
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
       isActive = this.hasBlock('list-item') && parent && parent.type === type
     }
   }

   return this.getIcon(icon, isActive, (event) => { this.onClickBlock(event, type) })
 }

 render() {
   const { innerRef } = this.props
   const main = window.document.getElementById('app')
   if (!main) { return }
   return ReactDOM.createPortal(
     <StyledMenu ref={innerRef}>
       {this.renderBlockButton('heading-one', 'format_heading_one')}
       {this.renderBlockButton('heading-two', 'format_heading_two')}
       {this.renderMarkButton('bold', 'format_bold')}
       {this.renderMarkButton('italic', 'format_italic')}
       {this.renderMarkButton('underlined', 'format_underlined')}
       {this.renderMarkButton('code', 'code')}
       {this.renderBlockButton('numbered-list', 'format_list_numbered')}
     </StyledMenu>,
     main as Element
   )
 }
}

export default EditorMenu
