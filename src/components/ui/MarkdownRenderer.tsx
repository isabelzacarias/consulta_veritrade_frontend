import { Children, isValidElement, type ReactNode } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface MarkdownRendererProps {
  content: string
  className?: string
  onListItemClick?: (text: string) => void
  listItemsDisabled?: boolean
}

function textFromChildren(children: ReactNode): string | undefined {
  const text = Children.toArray(children)
    .map((child) => {
      if (typeof child === 'string' || typeof child === 'number') {
        return String(child)
      }
      if (isValidElement(child)) {
        const props = child.props as { children?: ReactNode }
        return textFromChildren(props.children) ?? ''
      }
      return ''
    })
    .join('')
  return text || undefined
}

const baseComponents: Components = {
  table({ children }) {
    return (
      <div className="my-2 w-full overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full border-collapse text-left text-xs">
          {children}
        </table>
      </div>
    )
  },
  th({ children }) {
    return (
      <th className="border-b border-slate-200 bg-slate-100 p-2 text-left font-semibold whitespace-nowrap text-slate-700">
        {children}
      </th>
    )
  },
  td({ children }) {
    const title = textFromChildren(children)
    return (
      <td
        title={title}
        className="max-w-[180px] truncate border-b border-slate-100 p-2 align-middle text-slate-600"
      >
        {children}
      </td>
    )
  },
  a({ href, children }) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    )
  },
}

const baseClasses =
  'prose prose-sm max-w-none text-xs break-words text-slate-700 ' +
  'prose-headings:mt-3 prose-headings:mb-1.5 prose-headings:font-semibold prose-headings:text-slate-800 ' +
  'prose-h1:text-base prose-h2:text-sm prose-h3:text-sm ' +
  'prose-p:my-1.5 prose-p:leading-relaxed ' +
  'prose-strong:font-semibold prose-strong:text-slate-900 ' +
  'prose-a:font-medium prose-a:text-brand-700 prose-a:underline prose-a:underline-offset-2 ' +
  'prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5 prose-li:marker:text-slate-400 ' +
  'prose-code:rounded prose-code:bg-slate-100 prose-code:px-1 prose-code:py-0.5 prose-code:text-[11px] prose-code:font-medium prose-code:text-slate-800 prose-code:before:content-none prose-code:after:content-none ' +
  'prose-pre:my-2 prose-pre:bg-slate-900 prose-pre:p-3 prose-pre:text-[11px] prose-pre:text-slate-100 ' +
  'prose-blockquote:my-2 prose-blockquote:border-l-2 prose-blockquote:border-brand-300 prose-blockquote:pl-3 prose-blockquote:not-italic prose-blockquote:text-slate-600 ' +
  'prose-hr:my-3 ' +
  '[&>*:first-child]:mt-0 [&>*:last-child]:mb-0'

export function MarkdownRenderer({
  content,
  className = '',
  onListItemClick,
  listItemsDisabled = false,
}: MarkdownRendererProps) {
  const components: Components = onListItemClick
    ? {
        ...baseComponents,
        li({ children }) {
          const text = textFromChildren(children)?.trim()
          if (!text) return <li>{children}</li>

          return (
            <li className="my-0.5 list-none">
              <button
                type="button"
                onClick={() => onListItemClick(text)}
                disabled={listItemsDisabled}
                title="Seleccionar esta opción"
                className="text-left font-medium text-brand-700 underline decoration-brand-300 underline-offset-2 transition hover:text-brand-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {children}
              </button>
            </li>
          )
        },
      }
    : baseComponents

  return (
    <div className={`${baseClasses} ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  )
}
