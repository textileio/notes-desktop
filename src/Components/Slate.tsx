import { Editor, RenderNodeProps, EditorProps, RenderMarkProps } from 'slate-react'
import { Value } from 'slate'

import ReactDOM from 'react-dom'
import React from 'react'
import styled from '@emotion/styled'
import * as Icons from '@material-ui/icons'


interface ButtonProps {
  children: any
  reversed: boolean
  active?: boolean
  onMouseDown?: (event: React.MouseEvent) => void
}
class Button extends React.Component<ButtonProps> {
  render () {
    // return (
    //   <Icons.SyncProblem onMouseDown={this.props.onMouseDown} style={{background: 'none', color: 'gray', zIndex: 100}}>
    //     {this.props.children}
    //   </Icons.SyncProblem>
    // )
    return (
      <span style={{flex: 1}} onMouseDown={this.props.onMouseDown}>
      { this.props.children }
      </span>
    )
  }
}

interface IconProps {
  children: string
}
class Icon extends React.Component<IconProps> {
  render () {
    const iconStyle = {background: 'none', fontSize: 20, color: 'black', zIndex: 100}
    switch(this.props.children) {
      case 'format_bold': 
        return (
          <Icons.FormatBold style={iconStyle} />
        )
      case 'format_italic': 
        return (
          <Icons.FormatItalic style={iconStyle} />
        )
      case 'format_underlined': 
        return (
          <Icons.FormatUnderlined style={iconStyle} />
        )
      case 'code': 
        return (
          <Icons.Code style={iconStyle} />
        )
    }
    return
  }
}

// export const Button2 = styled('span')`
//   cursor: pointer;
//   color: ${(props) => {
//     props.reversed
//       ? props.active ? 'white' : '#aaa'
//       : props.active ? 'black' : '#ccc'};
//   }
// `

// export const Icon = styled(({ className, ...rest }) => {
//   return <span className={`material-icons ${className}`} {...rest} />
// })`
//   font-size: 18px;
//   vertical-align: text-bottom;
// `

export const Menu = styled('div')`
  & > * {
    display: inline-block;
  }
  & > * + * {
    margin-left: 15px;
  }
`
const StyledMenu = styled(Menu)`
  padding: 8px 7px 6px;
  position: absolute;
  z-index: 1;
  top: -10000px;
  left: -10000px;
  margin-top: -6px;
  opacity: 0;
  background-color: #fff;
  border: 1px solid #AAA;
  border-radius: 4px;
  padding-top: 8px;
  height: 64px;
  width: 130px;
  transition: opacity 0.75s;
`

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
                  "The editor gives you full control over the logic you can add. For example, it's fairly common to want to add markdown-like shortcuts to editors. So that, when you start a line with \"> \" you get a blockquote that looks like this:"
              }
            ]
          }
        ]
      },
      {
        "object": "block",
        "type": "block-quote",
        "nodes": [
          {
            "object": "text",
            "leaves": [
              {
                "text": "A wise quote."
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
                "text":
                  "Order when you start a line with \"## \" you get a level-two heading, like this:"
              }
            ]
          }
        ]
      },
      {
        "object": "block",
        "type": "heading-two",
        "nodes": [
          {
            "object": "text",
            "leaves": [
              {
                "text": "Try it out!"
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
                "text":
                  "Try it out for yourself! Try starting a new line with \">\", \"-\", or \"#\"s."
              }
            ]
          }
        ]
      }
    ]
  }
})

 interface ScreenProps {
   editor: any
  innerRef: (ref: HTMLDivElement | null) => void
  style?: React.CSSProperties
 }
class HoverMenu extends React.Component<ScreenProps> {

  onClickMark = (event: any, type: string) => {
    //@ts-ignore
    const { editor } = this.props
    event.preventDefault()
    editor.toggleMark(type)
  }

  renderMarkButton = (type: string, icon: string) => {
    //@ts-ignore
    const { editor } = this.props
    const { value } = editor
    const isActive = value.activeMarks.some((mark: any) => mark.type === type)
    return (
      <Button
        reversed
        active={isActive}
        onMouseDown={(event) => { this.onClickMark(event, type) }}
      >
        <Icon>{icon}</Icon>
      </Button>
    )
  }

  render() {
    const { innerRef } = this.props
    const root = window.document.getElementById('main')

    return ReactDOM.createPortal(
      <StyledMenu ref={innerRef}>
        {this.renderMarkButton('bold', 'format_bold')}
        {this.renderMarkButton('italic', 'format_italic')}
        {this.renderMarkButton('underlined', 'format_underlined')}
        {this.renderMarkButton('code', 'code')}
      </StyledMenu>,
      //@ts-ignore
      root
    )
  }
}

interface HoveringMenuProps {
  style?: React.CSSProperties
}

class HoveringMenu extends React.Component<HoveringMenuProps> {
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
    const { fragment, selection } = value

    if (selection.isBlurred || selection.isCollapsed || fragment.text === '') {
      menu.removeAttribute('style')
      return
    }

    const native = window.getSelection()
    console.log(native)
    const range = native && native.getRangeAt(0)
    console.log(range)
    const rect = range ? range.getBoundingClientRect() : {top: 10, left: 10, width: 100}
    console.log(rect)
    menu.style.opacity = '1'
    console.log(rect.top, window.pageYOffset, menu.offsetHeight)
    menu.style.top = `${rect.top - 60}px` //`${rect.top + window.pageYOffset - 100}px`
    menu.style.height = `30px`
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
          onChange={this.onChange}
          renderEditor={this.renderEditor}
          renderMark={this.renderMark}
          style={this.props.style}
        />
      </div>
    )
  }

  /**
   * Render the editor.
   *
   * @param {Object} props
   * @param {Function} next
   * @return {Element}
   */

  renderEditor = (props: EditorProps, editor: any, next: () => any) => {
    const children = next()
    return (
      <React.Fragment>
        {children}
        <HoverMenu innerRef={(menu: HTMLDivElement | null) => (this.menu = menu)} editor={editor} />
      </React.Fragment>
    )
  }

  /**
   * Render a Slate mark.
   *
   * @param {Object} props
   * @param {Editor} editor
   * @param {Function} next
   * @return {Element}
   */

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

  /**
   * On change.
   *
   * @param {Editor} editor
   */

  //@ts-ignore
   onChange = ({ value }) => {
    this.setState({ value })
  }
}

/**
 * Export.
 */

export default HoveringMenu