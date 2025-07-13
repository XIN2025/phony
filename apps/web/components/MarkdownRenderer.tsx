import React from 'react';
import ReactMarkdown from 'react-markdown';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  if (!content) {
    return <span className='text-muted-foreground'>No content available.</span>;
  }

  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <h1
              className='text-lg font-bold text-gray-900 mb-4 mt-6 first:mt-0'
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2
              className='text-base font-semibold text-gray-800 mb-3 mt-5 first:mt-0'
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3
              className='text-sm font-medium text-gray-700 mb-2 mt-4 first:mt-0'
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4
              className='text-xs font-medium text-gray-700 mb-2 mt-3 first:mt-0'
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {children}
            </h4>
          ),
          p: ({ children }) => <p className='text-sm text-gray-600 mb-3 leading-relaxed'>{children}</p>,
          ul: ({ children }) => (
            <ul className='list-disc list-inside text-sm text-gray-600 mb-3 space-y-1'>{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className='list-decimal list-inside text-sm text-gray-600 mb-3 space-y-1'>{children}</ol>
          ),
          li: ({ children }) => <li className='text-sm text-gray-600 leading-relaxed'>{children}</li>,
          strong: ({ children }) => <strong className='font-semibold text-gray-800'>{children}</strong>,
          em: ({ children }) => <em className='italic text-gray-700'>{children}</em>,
          blockquote: ({ children }) => (
            <blockquote className='border-l-4 border-blue-500 pl-4 py-2 my-3 bg-blue-50 rounded-r'>
              <p className='text-sm text-gray-700 italic'>{children}</p>
            </blockquote>
          ),
          code: ({ children, className }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code className='bg-gray-100 text-gray-800 px-1 py-0.5 rounded text-xs font-mono'>{children}</code>
              );
            }
            return (
              <pre className='bg-gray-100 p-3 rounded-lg overflow-x-auto my-3'>
                <code className='text-xs font-mono text-gray-800'>{children}</code>
              </pre>
            );
          },
          hr: () => <hr className='border-gray-300 my-4' />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
