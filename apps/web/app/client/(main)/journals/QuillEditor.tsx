import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

const Font = (Quill as any).import('formats/font');
if (Font) {
  Font.whitelist = ['roboto', 'serif', 'sans-serif', 'monospace'];
  (Quill as any).register(Font, true);
}
const Size = (Quill as any).import('attributors/style/size');
if (Size) {
  delete Size.whitelist;
  (Quill as any).register(Size, true);
}

export interface QuillEditorHandles {
  undo: () => void;
  redo: () => void;
  setFontSize: (size: number) => void;
  setFontFamily: (font: string) => void;
}

interface QuillEditorProps {
  value: string;
  onChange: (value: string) => void;
  isActive: boolean;
  toolbarId: string;
}

const QuillEditor = forwardRef<QuillEditorHandles, QuillEditorProps>(
  ({ value, onChange, isActive, toolbarId }, ref) => {
    const editorRef = useRef<HTMLDivElement | null>(null);
    const quillRef = useRef<Quill | null>(null);
    const lastValueRef = useRef<string>(value);

    useImperativeHandle(
      ref,
      () => ({
        undo: () => {
          if (quillRef.current) {
            (quillRef.current.getModule('history') as any).undo();
          }
        },
        redo: () => {
          if (quillRef.current) {
            (quillRef.current.getModule('history') as any).redo();
          }
        },
        setFontSize: (size: number) => {
          if (quillRef.current) {
            const range = quillRef.current.getSelection();
            if (range) {
              quillRef.current.format('size', size + 'px');
            }
          }
        },
        setFontFamily: (font: string) => {
          if (quillRef.current) {
            const range = quillRef.current.getSelection();
            if (range) {
              quillRef.current.format('font', font);
            }
          }
        },
      }),
      [],
    );

    useEffect(() => {
      if (!editorRef.current) return;
      if (quillRef.current) {
        quillRef.current.off('text-change');
        quillRef.current = null;
        editorRef.current.innerHTML = '';
      }
      const modules = {
        toolbar: isActive ? `#${toolbarId}` : false,
        history: {
          delay: 1000,
          maxStack: 500,
          userOnly: false,
        },
      };
      const quill = new Quill(editorRef.current, {
        theme: 'snow',
        modules,
        readOnly: !isActive,
      });
      quillRef.current = quill;
      if (value && value !== quill.root.innerHTML) {
        const delta = quill.clipboard.convert({ html: value });
        quill.setContents(delta);
      }
      quill.on('text-change', () => {
        const html = quill.root.innerHTML;
        if (html !== lastValueRef.current) {
          lastValueRef.current = html;
          onChange(html);
        }
      });
      return () => {
        quill.off('text-change');
        quillRef.current = null;
        if (editorRef.current) editorRef.current.innerHTML = '';
      };
    }, [isActive, toolbarId]);

    useEffect(() => {
      if (quillRef.current && value !== lastValueRef.current) {
        const quill = quillRef.current;
        const delta = quill.clipboard.convert({ html: value });
        quill.setContents(delta);
        lastValueRef.current = value;
      }
    }, [value]);

    return (
      <div
        ref={editorRef}
        style={{
          minHeight: 100,
          background: 'white',
          wordBreak: 'break-word',
          overflowWrap: 'anywhere',
          whiteSpace: 'pre-wrap',
        }}
      />
    );
  },
);

export default QuillEditor;
