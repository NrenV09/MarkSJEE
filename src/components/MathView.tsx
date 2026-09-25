/**
 * MathView.jsx / MathView.tsx
 * KaTeX Math Renderer for Marks by MathonGo Replica
 * Handles inline $..$ and block $$..$$ LaTeX equations smoothly.
 */

import React, { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface MathViewProps {
  content: string;
  className?: string;
  block?: boolean;
}

interface Segment {
  type: 'text' | 'inline-math' | 'block-math';
  value: string;
}

/**
 * Tokenize string into text, inline math ($...$), and display math ($$...$$)
 */
function parseMathSegments(rawText: string): Segment[] {
  if (!rawText) return [];

  const segments: Segment[] = [];
  let cursor = 0;
  const len = rawText.length;

  while (cursor < len) {
    // Check for display block math ($$...$$)
    if (rawText.startsWith('$$', cursor)) {
      const closing = rawText.indexOf('$$', cursor + 2);
      if (closing !== -1) {
        const math = rawText.slice(cursor + 2, closing).trim();
        segments.push({ type: 'block-math', value: math });
        cursor = closing + 2;
        continue;
      }
    }

    // Check for inline math ($...$)
    if (rawText.startsWith('$', cursor) && !rawText.startsWith('$$', cursor)) {
      let closing = -1;
      for (let i = cursor + 1; i < len; i++) {
        if (rawText[i] === '$' && rawText[i - 1] !== '\\') {
          closing = i;
          break;
        }
      }

      if (closing !== -1) {
        const math = rawText.slice(cursor + 1, closing).trim();
        segments.push({ type: 'inline-math', value: math });
        cursor = closing + 1;
        continue;
      }
    }

    // Find next delimiter
    const nextBlock = rawText.indexOf('$$', cursor);
    const nextInline = rawText.indexOf('$', cursor);

    let nextIndex = -1;
    if (nextBlock !== -1 && nextInline !== -1) {
      nextIndex = Math.min(nextBlock, nextInline);
    } else if (nextBlock !== -1) {
      nextIndex = nextBlock;
    } else if (nextInline !== -1) {
      nextIndex = nextInline;
    }

    if (nextIndex === -1) {
      segments.push({ type: 'text', value: rawText.slice(cursor) });
      break;
    } else {
      if (nextIndex > cursor) {
        segments.push({ type: 'text', value: rawText.slice(cursor, nextIndex) });
      }
      cursor = nextIndex;
    }
  }

  return segments;
}

function renderKaTeX(latex: string, displayMode: boolean): string {
  try {
    return katex.renderToString(latex, {
      displayMode,
      throwOnError: false,
      output: 'htmlAndMathml',
      strict: false,
      trust: true
    });
  } catch (err) {
    return `<span class="text-rose-400 font-mono text-xs">[Formula Error]</span>`;
  }
}

export const MathView: React.FC<MathViewProps> = ({ content, className = '', block = false }) => {
  const segments = useMemo(() => parseMathSegments(content), [content]);

  if (block && segments.length === 1 && segments[0].type === 'block-math') {
    const html = renderKaTeX(segments[0].value, true);
    return (
      <div 
        className={`my-3 overflow-x-auto text-center py-2 ${className}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <div className={`leading-relaxed text-slate-200 select-text ${className}`}>
      {segments.map((seg, idx) => {
        if (seg.type === 'block-math') {
          const html = renderKaTeX(seg.value, true);
          return (
            <div
              key={idx}
              className="my-3 overflow-x-auto py-2.5 px-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        }

        if (seg.type === 'inline-math') {
          const html = renderKaTeX(seg.value, false);
          return (
            <span
              key={idx}
              className="inline-block px-0.5 align-baseline"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        }

        return <span key={idx}>{seg.value}</span>;
      })}
    </div>
  );
};

export default MathView;
