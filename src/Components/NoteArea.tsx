import React from 'react'
import { Editor, EditorProps, RenderMarkProps, RenderNodeProps, EventHook } from 'slate-react'
import { Value, Node } from 'slate'
import EditorMenu from './EditorMenu'

interface TextAreaProps {
  value: Value
  onChange: (note: Value) => void
  style?: React.CSSProperties
}

class NoteArea extends React.Component<TextAreaProps> {
  /**
   * Deserialize the raw initial value.
   *
   * @type {Object}
   */

  menu?: HTMLDivElement | null

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
    if (!menu) { return }

    const { value } = this.props
    const { fragment, selection } = value

    // avoids moving the menu after already open
    if (selection.isBlurred || selection.isCollapsed || fragment.text === '') {
      menu.removeAttribute('style')
      return
    }

    const native = window.getSelection()
    const range = native && native.getRangeAt(0)
    const rect = range ? range.getBoundingClientRect() : {top: 10, left: 10, width: 100}
    menu.style.opacity = '1'
    menu.style.top = `${rect.top - 60}px` // `${rect.top + window.pageYOffset - 100}px`
    menu.style.height = `46px`
    menu.style.left = `${rect.left +
      window.pageXOffset -
      menu.offsetWidth / 2 +
      rect.width / 2}px`
  }

   // @ts-ignore
  onChange = (event: { operations: Immutable.List<Operation>, value: Value }) => {
    this.props.onChange(event.value)
  }

  render() {
    return (
      <div>
        <Editor
          autoFocus={true}
          placeholder={'Enter some text...'}
          value={this.props.value}
          onChange={this.onChange}
          renderNode={this.renderNode}
          renderEditor={this.renderEditor}
          renderMark={this.renderMark}
          style={this.props.style}
          className={'text'}
          plugins={Plugins}
        />
      </div>
    )
  }

  renderNode = (props: RenderNodeProps, editor: any, next: () => any) => {
    const { attributes, children, node } = props
    switch (node.type) {
      case 'heading-one':
        return <h1 {...attributes}>{children}</h1>
      case 'heading-two':
        return <h2 {...attributes}>{children}</h2>
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

  renderEditor = (props: EditorProps, editor: any, next: () => any) => {
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

const Plugins = [
  AutoExitBlock()
]

function AutoExitBlock() {
  return {
    // @ts-ignore
    onKeyDown(event, change, next) {

      const options = {
        blockType: /^(heading-one|heading-two)$/,
        exitBlockType: 'paragraph',
        onEmptyBlock: false,
        unwrap: false
      }

      if (event.key !== 'Enter' && !event.shiftKey) {
        return next()
      }

      const block = change.value.startBlock
      const blockType = block.type
      const isBlockEmpty = block.isEmpty

      const regexp = RegExp(options.blockType)
      if (regexp.test(blockType) && options.blockType === blockType) {
        if (options.onEmptyBlock) {
          if (isBlockEmpty) {
            if (options.unwrap) {
              const parentType = change.value.document.getParent(block.key).type
              return change.setBlocks(options.exitBlockType).unwrapBlock(parentType)
            } else {
              return change.setBlocks(options.exitBlockType)
            }
          } else {
            return
          }
        } else {
          return change.insertBlock(options.exitBlockType)
        }
      }
      return next()
    }
  }
}

export default NoteArea
