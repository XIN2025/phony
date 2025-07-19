import React, { useLayoutEffect, useEffect, useRef, useImperativeHandle, forwardRef, useState } from 'react';
console.log('[QuillEditor] File loaded');
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import { useUploadJournalImage } from '@/lib/hooks/use-api';
import { toast } from 'sonner';

console.log('[QuillEditor] Quill imported:', Quill);

try {
  const Font = (Quill as any).import('formats/font');
  if (Font) {
    Font.whitelist = ['roboto', 'serif', 'sans-serif', 'monospace'];
    (Quill as any).register(Font, true);
    console.log('[QuillEditor] Font registered:', Font);
  }
  const Size = (Quill as any).import('attributors/style/size');
  if (Size) {
    delete Size.whitelist;
    (Quill as any).register(Size, true);
    console.log('[QuillEditor] Size registered:', Size);
  }
} catch (err) {
  console.error('[QuillEditor] Error during Quill module registration:', err);
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
}

const QuillEditor = forwardRef<QuillEditorHandles, QuillEditorProps>(({ value, onChange, isActive }, ref) => {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const quillRef = useRef<Quill | null>(null);
  const lastValueRef = useRef<string>(value);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const uploadJournalImage = useUploadJournalImage();
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const [fontSize, setFontSize] = useState<number>(14);
  const [isSmScreen, setIsSmScreen] = useState(true);

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
    const checkScreen = () => setIsSmScreen(window.innerWidth >= 640);
    checkScreen();
    window.addEventListener('resize', checkScreen);
    return () => window.removeEventListener('resize', checkScreen);
  }, []);

  useLayoutEffect(() => {
    if (!editorRef.current || !toolbarRef.current) return;
    if (quillRef.current) return;
    const modules = {
      toolbar: toolbarRef.current,
      history: {
        delay: 1000,
        maxStack: 500,
        userOnly: false,
      },
    };
    try {
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
      quill.on('selection-change', (range: any) => {
        if (quill && range) {
          const format = quill.getFormat(range.index, range.length);
          let currentSize = 14;
          if (typeof format.size === 'string') {
            const match = /([0-9]+)px/.exec(format.size || '');
            if (match) currentSize = parseInt(match[1] ?? '0', 10);
            else if (!isNaN(Number(format.size ?? ''))) currentSize = Number(format.size ?? '');
          }
          setFontSize(currentSize);
        }
      });
    } catch (err) {
      console.error('[QuillEditor] Error creating Quill instance:', err);
    }
    return () => {
      if (quillRef.current) {
        quillRef.current.off('text-change');
        quillRef.current = null;
      }
      if (editorRef.current) editorRef.current.innerHTML = '';
    };
  }, []);

  useEffect(() => {
    if (quillRef.current) {
      quillRef.current.enable(isActive);
    }
  }, [isActive]);

  useEffect(() => {
    if (quillRef.current && value !== lastValueRef.current) {
      const quill = quillRef.current;
      const delta = quill.clipboard.convert({ html: value });
      quill.setContents(delta);
      lastValueRef.current = value;
      console.log('[QuillEditor] Value updated in useEffect', value);
    }
  }, [value]);

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('[QuillEditor] onFileChange called');

    const file = e.target.files?.[0];
    if (!file) {
      console.log('[QuillEditor] No file selected');
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
      toast.error('Only JPG, PNG, GIF, and WEBP images are allowed.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    try {
      const result = await uploadJournalImage.mutateAsync(file);
      if (result && result.url) {
        const quill = quillRef.current;
        if (quill) {
          const range = quill.getSelection(true);
          const imageUrl = result.url.startsWith('http') ? result.url : `${backendUrl}${result.url}`;
          quill.insertEmbed(range ? range.index : 0, 'image', imageUrl, 'user');
          console.log('[QuillEditor] Image inserted at', range ? range.index : 0, imageUrl);
        }
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      toast.error(
        'Failed to upload image. Make sure your backend is running and accessible at the correct port (default: 3001).',
      );
      console.error('[QuillEditor] Image upload error', err);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <div
        ref={toolbarRef}
        className='flex flex-wrap items-center gap-1 bg-gray-100 rounded-lg p-2 shadow-sm mb-4 w-full max-w-full min-w-0'
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {/* Always visible controls (mobile & up) */}
        <div className='flex items-center gap-1'>
          <button
            type='button'
            className='ql-undo h-8 w-8 flex-shrink-0'
            aria-label='Undo'
            onClick={() => {
              if (quillRef.current) {
                (quillRef.current.getModule('history') as any).undo();
              }
            }}
          >
            {/* Undo icon */}
            <svg width='18' height='18' viewBox='0 0 18 18' fill='none' xmlns='http://www.w3.org/2000/svg'>
              <path
                d='M7 4V1L2 5.5L7 10V7C11 7 13 9 14 12C13 9 11 4 7 4Z'
                stroke='currentColor'
                strokeWidth='1.5'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
            </svg>
          </button>
          <button
            type='button'
            className='ql-redo h-8 w-8 flex-shrink-0'
            aria-label='Redo'
            onClick={() => {
              if (quillRef.current) {
                (quillRef.current.getModule('history') as any).redo();
              }
            }}
          >
            {/* Redo icon */}
            <svg width='18' height='18' viewBox='0 0 18 18' fill='none' xmlns='http://www.w3.org/2000/svg'>
              <path
                d='M11 4V1L16 5.5L11 10V7C7 7 5 9 4 12C5 9 7 4 11 4Z'
                stroke='currentColor'
                strokeWidth='1.5'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
            </svg>
          </button>
        </div>
        <div className='flex items-center gap-1'>
          <button
            type='button'
            className='ql-decreaseFont h-8 w-8 flex-shrink-0'
            aria-label='Decrease font size'
            onClick={() => {
              if (quillRef.current) {
                const quill = quillRef.current;
                const range = quill.getSelection();
                if (range) {
                  const format = quill.getFormat(range.index, range.length);
                  let currentSize = fontSize;
                  const newSize = Math.max(8, currentSize - 2);
                  quill.format('size', `${newSize}px`);
                  setFontSize(newSize);
                }
              }
            }}
          >
            {/* Minus icon */}
            <svg width='18' height='18' viewBox='0 0 18 18' fill='none' xmlns='http://www.w3.org/2000/svg'>
              <rect x='4' y='8.25' width='10' height='1.5' rx='0.75' fill='currentColor' />
            </svg>
          </button>
          <input
            type='number'
            min={8}
            max={100}
            className='w-12 min-w-0 text-center rounded border border-gray-300 bg-white px-1 py-1 text-xs mx-1 h-8 flex-shrink-0'
            style={{ appearance: 'textfield' }}
            value={fontSize}
            onChange={(e) => {
              let newSize = parseInt(e.target.value, 10);
              if (isNaN(newSize)) newSize = 14;
              newSize = Math.max(8, Math.min(100, newSize));
              setFontSize(newSize);
              if (quillRef.current) {
                const quill = quillRef.current;
                const range = quill.getSelection();
                if (range) {
                  quill.format('size', `${newSize}px`);
                }
              }
            }}
            onBlur={(e) => {
              let newSize = parseInt(e.target.value, 10);
              if (isNaN(newSize)) newSize = 14;
              newSize = Math.max(8, Math.min(100, newSize));
              setFontSize(newSize);
              if (quillRef.current) {
                const quill = quillRef.current;
                const range = quill.getSelection();
                if (range) {
                  quill.format('size', `${newSize}px`);
                }
              }
            }}
          />
          <button
            type='button'
            className='ql-increaseFont h-8 w-8 flex-shrink-0'
            aria-label='Increase font size'
            onClick={() => {
              if (quillRef.current) {
                const quill = quillRef.current;
                const range = quill.getSelection();
                if (range) {
                  const format = quill.getFormat(range.index, range.length);
                  let currentSize = fontSize;
                  const newSize = Math.min(100, currentSize + 2);
                  quill.format('size', `${newSize}px`);
                  setFontSize(newSize);
                }
              }
            }}
          >
            {/* Plus icon */}
            <svg width='18' height='18' viewBox='0 0 18 18' fill='none' xmlns='http://www.w3.org/2000/svg'>
              <rect x='8.25' y='4' width='1.5' height='10' rx='0.75' fill='currentColor' />
              <rect x='4' y='8.25' width='10' height='1.5' rx='0.75' fill='currentColor' />
            </svg>
          </button>
        </div>
        <div className='flex items-center gap-1'>
          <button
            type='button'
            className='custom-image-btn h-8 w-8 flex-shrink-0'
            aria-label='Insert image'
            onClick={() => {
              if (fileInputRef.current) fileInputRef.current.value = '';
              if (fileInputRef.current) fileInputRef.current.click();
            }}
          >
            {/* Image icon */}
            <svg width='18' height='18' viewBox='0 0 18 18' fill='none' xmlns='http://www.w3.org/2000/svg'>
              <rect x='2' y='4' width='14' height='10' rx='2' stroke='currentColor' strokeWidth='1.5' />
              <circle cx='6' cy='8' r='1' fill='currentColor' />
              <path d='M3 13L7.5 9L11 12L13 10L15 13' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' />
            </svg>
          </button>
        </div>
        <div className='flex items-center gap-1'>
          <button type='button' className='ql-bold h-8 w-8 flex-shrink-0' aria-label='Bold'></button>
          {isSmScreen && (
            <button type='button' className='ql-italic h-8 w-8 flex-shrink-0' aria-label='Italic'></button>
          )}
        </div>

        {/* All other controls: hidden on small screens, visible on sm+ */}
        <div className='flex items-center gap-1 hidden sm:flex'>
          <select
            className='ql-font h-8 min-w-[80px] max-w-[100px] text-xs flex-shrink-0'
            onChange={(e) => {
              if (quillRef.current) {
                const range = quillRef.current.getSelection();
                if (range) {
                  quillRef.current.format('font', e.target.value);
                }
              }
            }}
          >
            <option value='roboto'>Roboto</option>
            <option value='serif'>Serif</option>
            <option value='sans-serif'>Sans Serif</option>
            <option value='monospace'>Monospace</option>
          </select>
        </div>
        <div className='flex items-center gap-1 hidden sm:flex'>
          <button type='button' className='ql-link h-8 w-8 flex-shrink-0' aria-label='Insert link'></button>
        </div>
      </div>
      <input
        type='file'
        accept='image/jpeg,image/png,image/gif,image/webp'
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={onFileChange}
      />
      <div
        ref={editorRef}
        className='w-full min-w-0 max-w-full rounded-lg border border-gray-200 bg-white shadow-sm'
        style={{
          minHeight: 100,
          wordBreak: 'break-word',
          overflowWrap: 'anywhere',
          whiteSpace: 'pre-wrap',
        }}
      />
    </>
  );
});

export default QuillEditor;
