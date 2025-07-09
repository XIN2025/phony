import React, { useEffect, useRef } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

interface QuillEditorProps {
  value: string;
  onChange: (value: string) => void;
  isActive: boolean;
  toolbarId: string;
}

const QuillEditor: React.FC<QuillEditorProps> = ({ value, onChange, isActive, toolbarId }) => {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const quillRef = useRef<Quill | null>(null);
  const lastValueRef = useRef<string>(value);

  useEffect(() => {
    if (!editorRef.current) return;
    // Clean up previous instance
    if (quillRef.current) {
      quillRef.current.off('text-change');
      quillRef.current = null;
      editorRef.current.innerHTML = '';
    }
    // Setup modules
    const modules: Quill.Options['modules'] = {
      toolbar: isActive ? `#${toolbarId}` : false,
      history: {
        delay: 1000,
        maxStack: 500,
        userOnly: false,
      },
    };
    // Create Quill instance
    const quill = new Quill(editorRef.current, {
      theme: 'snow',
      modules,
      readOnly: !isActive,
    });
    quillRef.current = quill;
    // Set initial value
    if (value && value !== quill.root.innerHTML) {
      const delta = quill.clipboard.convert(value);
      quill.setContents(delta);
    }
    // Listen for changes
    quill.on('text-change', () => {
      const html = quill.root.innerHTML;
      if (html !== lastValueRef.current) {
        lastValueRef.current = html;
        onChange(html);
      }
    });
    // Clean up
    return () => {
      quill.off('text-change');
      quillRef.current = null;
      if (editorRef.current) editorRef.current.innerHTML = '';
    };
    // eslint-disable-next-line
  }, [isActive, toolbarId]);

  // Update value if changed from outside
  useEffect(() => {
    if (quillRef.current && value !== lastValueRef.current) {
      const quill = quillRef.current;
      const delta = quill.clipboard.convert(value);
      quill.setContents(delta);
      lastValueRef.current = value;
    }
  }, [value]);

  return <div ref={editorRef} style={{ height: 200, minHeight: 100, background: 'white' }} />;
};

export default QuillEditor;
