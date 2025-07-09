'use client';
import { Button } from '@repo/ui/components/button';
import { useState, useCallback, useRef, useEffect } from 'react';
import { createEditor, Descendant, BaseEditor } from 'slate';
import { Slate, Editable, withReact, ReactEditor, useSlate } from 'slate-react';
import { withHistory } from 'slate-history';
import { Bold, Italic, Underline } from 'lucide-react';

// Define a ParagraphElement type for Slate
interface ParagraphElement {
  type: 'paragraph';
  children: { text: string }[];
}

type CustomElement = ParagraphElement;
type CustomDescendant = CustomElement | { text: string };

declare module 'slate' {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor;
    Element: CustomElement;
    Text: { text: string; bold?: boolean; italic?: boolean; underline?: boolean };
  }
}

const JOURNAL_CARDS = [
  {
    title: 'How are you feeling?',
    placeholder: 'Write about your feelings...',
    key: 'feelings',
  },
  {
    title: 'Task Feedback',
    placeholder: 'Share feedback on your tasks...',
    key: 'feedback',
  },
  {
    title: "What's on your mind?",
    placeholder: "Anything else you'd like to add?",
    key: 'mind',
  },
];

const initialValue: CustomDescendant[] = [
  {
    type: 'paragraph',
    children: [{ text: '' }],
  },
];

function ToolbarButton({
  icon,
  active,
  onMouseDown,
  label,
}: {
  icon: React.ReactNode;
  active?: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  label: string;
}) {
  return (
    <button
      type='button'
      onMouseDown={onMouseDown}
      className={`p-2 rounded transition-colors border border-transparent ${active ? 'bg-primary/10 border-primary text-primary font-bold shadow' : 'hover:bg-gray-200'}`}
      aria-label={label}
    >
      {icon}
    </button>
  );
}

const toggleMark = (editor: ReactEditor, format: string, onToggle?: () => void) => {
  const isActive = isMarkActive(editor, format);
  if (isActive) {
    editor.removeMark(format);
  } else {
    editor.addMark(format, true);
  }
  // Call the callback to update formatting state immediately
  if (onToggle) {
    setTimeout(onToggle, 0);
  }
};

const isMarkActive = (editor: ReactEditor, format: string) => {
  const marks = editor.marks as Record<string, any> | null | undefined;
  return marks ? marks[format] === true : false;
};

function SlateToolbar({
  editor,
  formattingState,
  onFormatChange,
}: {
  editor: ReactEditor;
  formattingState: { bold: boolean; italic: boolean; underline: boolean };
  onFormatChange: () => void;
}) {
  return (
    <div className='flex items-center gap-1 border-b bg-background rounded-t-xl px-2 py-1'>
      <ToolbarButton
        icon={<Bold className='w-4 h-4' />}
        label='Bold'
        active={formattingState.bold}
        onMouseDown={(e) => {
          e.preventDefault();
          toggleMark(editor, 'bold', onFormatChange);
        }}
      />
      <ToolbarButton
        icon={<Italic className='w-4 h-4' />}
        label='Italic'
        active={formattingState.italic}
        onMouseDown={(e) => {
          e.preventDefault();
          toggleMark(editor, 'italic', onFormatChange);
        }}
      />
      <ToolbarButton
        icon={<Underline className='w-4 h-4' />}
        label='Underline'
        active={formattingState.underline}
        onMouseDown={(e) => {
          e.preventDefault();
          toggleMark(editor, 'underline', onFormatChange);
        }}
      />
    </div>
  );
}

const renderLeaf = (props: any) => {
  let { children } = props;
  if (props.leaf.bold) {
    children = <strong>{children}</strong>;
  }
  if (props.leaf.italic) {
    children = <em>{children}</em>;
  }
  if (props.leaf.underline) {
    children = <u>{children}</u>;
  }
  return <span {...props.attributes}>{children}</span>;
};

export default function NewJournalPage() {
  const [editors] = useState(() => JOURNAL_CARDS.map(() => withHistory(withReact(createEditor()))));
  const [values, setValues] = useState(() => JOURNAL_CARDS.map(() => initialValue));
  const [activeIdx, setActiveIdx] = useState(0); // Track which card/editor is active
  const [formattingState, setFormattingState] = useState(() =>
    JOURNAL_CARDS.map(() => ({ bold: false, italic: false, underline: false })),
  );

  const handleChange = useCallback((idx: number, value: CustomDescendant[]) => {
    setValues((vs) => vs.map((v, i) => (i === idx ? value : v)));
  }, []);

  const updateFormattingState = useCallback(
    (idx: number) => {
      const editor = editors[idx];
      if (editor) {
        const marks = editor.marks as Record<string, any> | null | undefined;
        setFormattingState((fs) =>
          fs.map((f, i) =>
            i === idx
              ? {
                  bold: marks?.bold === true,
                  italic: marks?.italic === true,
                  underline: marks?.underline === true,
                }
              : f,
          ),
        );
      }
    },
    [editors],
  );

  const editor = editors[activeIdx];
  const value = values[activeIdx];

  // Update formatting state when switching cards
  useEffect(() => {
    updateFormattingState(activeIdx);
  }, [activeIdx, updateFormattingState]);

  return (
    <div className='flex flex-col h-full min-h-screen'>
      <div className='flex items-center justify-between px-8 pt-6 pb-2'>
        <div className='text-lg font-logo font-semibold tracking-tight'>Continuum</div>
        <div className='text-sm text-muted-foreground'>28 June, 2025</div>
        <Button
          className='rounded-full px-6 py-2 bg-black text-white hover:bg-gray-900 text-sm font-semibold'
          size='sm'
        >
          Publish Entry
        </Button>
      </div>
      {/* Single Toolbar and Editable for the active card */}
      <div className='mx-auto w-full max-w-5xl mt-2'>
        {editor && value && (
          <Slate
            editor={editor}
            initialValue={value}
            onChange={(v) => handleChange(activeIdx, v)}
            onSelectionChange={() => updateFormattingState(activeIdx)}
          >
            <SlateToolbar
              editor={editor}
              formattingState={formattingState[activeIdx] || { bold: false, italic: false, underline: false }}
              onFormatChange={() => updateFormattingState(activeIdx)}
            />
            <div
              className={`flex-1 bg-gray-200/70 rounded-2xl min-h-[340px] shadow-inner relative flex flex-col transition-all border-2 border-primary ring-2 ring-primary/30 shadow-lg z-10 mt-6`}
            >
              <div className='px-4 pt-4 pb-2 text-sm font-semibold text-foreground'>
                {JOURNAL_CARDS[activeIdx]?.title}
              </div>
              <Editable
                className='flex-1 resize-none bg-transparent px-4 pb-4 outline-none text-base text-foreground placeholder:text-muted-foreground min-h-[220px]'
                placeholder={JOURNAL_CARDS[activeIdx]?.placeholder}
                renderLeaf={renderLeaf}
                spellCheck
                autoFocus
                onFocus={() => setActiveIdx(activeIdx)}
              />
            </div>
          </Slate>
        )}
      </div>
      {/* Render the other cards as non-editable previews */}
      <div className='mx-auto w-full max-w-5xl flex gap-6 mt-6'>
        {JOURNAL_CARDS.map((card, idx) => {
          if (idx === activeIdx) return null;
          return (
            <div
              key={card.key}
              className={`flex-1 bg-gray-200/70 rounded-2xl min-h-[340px] shadow-inner relative flex flex-col border border-gray-200 opacity-60 cursor-pointer transition-all`}
              onClick={() => setActiveIdx(idx)}
              tabIndex={0}
              role='button'
              aria-label={`Edit ${card.title}`}
            >
              <div className='px-4 pt-4 pb-2 text-sm font-semibold text-foreground'>{card.title}</div>
              <div className='flex-1 px-4 pb-4 text-base text-foreground min-h-[220px] break-words whitespace-pre-line select-none pointer-events-none'>
                {/* Render a plain text preview of the value */}
                {(() => {
                  const node = values?.[idx]?.[0];
                  if (node && typeof node === 'object' && 'children' in node && Array.isArray((node as any).children)) {
                    return (node as any).children.map((c: any) => c.text).join('');
                  }
                  return <span className='text-muted-foreground'>{card.placeholder}</span>;
                })()}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
