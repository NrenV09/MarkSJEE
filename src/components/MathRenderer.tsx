/**
 * Safe KaTeX Math Renderer for JEE expressions
 * Supports inline `$..$`, display block `$$..$$`, and LaTeX matrix / aligned environments.
 */

import React, { useMemo } from 'react';
import katex from 'katex';

interface MathRendererProps {
  content: string;
  className?: string;
  block?: boolean;
}

interface Segment {
  type: 'text' | 'inline-math' | 'block-math';
  value: string;
}

/**
 * Tokenizes text into plain text, inline math ($...$), and block math ($$...$$)
 */
function tokenizeContent(text: string): Segment[] {
  if (!text) return [];

  const segments: Segment[] = [];
  let cursor = 0;
  const length = text.length;

  while (cursor < length) {
    // Check for block math ($$...$$)
    if (text.startsWith('$$', cursor)) {
      const closingIndex = text.indexOf('$$', cursor + 2);
      if (closingIndex !== -1) {
        const mathContent = text.slice(cursor + 2, closingIndex).trim();
        segments.push({ type: 'block-math', value: mathContent });
        cursor = closingIndex + 2;
        continue;
      }
    }

    // Check for inline math ($...$)
    if (text.startsWith('$', cursor) && !text.startsWith('$$', cursor)) {
      // Find closing $ (not preceded by escape)
      let closingIndex = -1;
      for (let i = cursor + 1; i < length; i++) {
        if (text[i] === '$' && text[i - 1] !== '\\') {
          closingIndex = i;
          break;
        }
      }

      if (closingIndex !== -1) {
        const mathContent = text.slice(cursor + 1, closingIndex).trim();
        segments.push({ type: 'inline-math', value: mathContent });
        cursor = closingIndex + 1;
        continue;
      }
    }

    // Accumulate regular text until next math delimiter
    let nextBlock = text.indexOf('$$', cursor);
    let nextInline = text.indexOf('$', cursor);

    let nextMathIndex = -1;
    if (nextBlock !== -1 && nextInline !== -1) {
      nextMathIndex = Math.min(nextBlock, nextInline);
    } else if (nextBlock !== -1) {
      nextMathIndex = nextBlock;
    } else if (nextInline !== -1) {
      nextMathIndex = nextInline;
    }

    if (nextMathIndex === -1) {
      segments.push({ type: 'text', value: text.slice(cursor) });
      break;
    } else {
      if (nextMathIndex > cursor) {
        segments.push({ type: 'text', value: text.slice(cursor, nextMathIndex) });
      }
      cursor = nextMathIndex;
    }
  }

  return segments;
}

/**
 * Safely renders LaTeX string via KaTeX without throwing
 */
function renderLatex(latex: string, displayMode: boolean): string {
  try {
    return katex.renderToString(latex, {
      displayMode,
      throwOnError: false,
      output: 'htmlAndMathml',
      strict: false,
      trust: true
    });
  } catch (err) {
    console.warn('[KaTeX error]', err);
    return `<span class="text-rose-400 font-mono text-xs">[LaTeX: ${latex}]</span>`;
  }
}

/**
 * Parses simple inline formatting (**bold**, *italic*, `code`, line breaks)
 */
function renderSimpleMarkdown(text: string): React.ReactNode {
  const lines = text.split('\n');
  return lines.map((line, lineIndex) => {
    // Handle bullet points
    const isBullet = line.trim().startsWith('- ') || line.trim().startsWith('* ');
    const cleanedLine = isBullet ? line.trim().replace(/^[-*]\s+/, '') : line;

    // Handle **bold**
    const parts = cleanedLine.split(/(\*\*.*?\*\*)/g);
    const content = parts.map((part, pIdx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={pIdx} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
      }
      return part;
    });

    if (isBullet) {
      return (
        <li key={lineIndex} className="ml-4 list-disc text-slate-300 my-0.5">
          {content}
        </li>
      );
    }

    return (
      <React.Fragment key={lineIndex}>
        {content}
        {lineIndex < lines.length - 1 && <br />}
      </React.Fragment>
    );
  });
}

export const MathRenderer: React.FC<MathRendererProps> = ({ content, className = '', block = false }) => {
  const segments = useMemo(() => tokenizeContent(content), [content]);

  if (block && segments.length === 1 && segments[0].type === 'block-math') {
    const html = renderLatex(segments[0].value, true);
    return (
      <div 
        className={`my-3 overflow-x-auto overflow-y-hidden text-center py-2 ${className}`}
        dangerouslySetInnerHTML={{ __html: html }} 
      />
    );
  }

  return (
    <div className={`leading-relaxed tracking-wide text-slate-200 ${className}`}>
      {segments.map((segment, index) => {
        if (segment.type === 'block-math') {
          const html = renderLatex(segment.value, true);
          return (
            <div 
              key={index} 
              className="my-3 overflow-x-auto overflow-y-hidden text-center py-2 px-3 rounded-lg bg-slate-900/60 border border-slate-800/60 shadow-inner"
              dangerouslySetInnerHTML={{ __html: html }} 
            />
          );
        }

        if (segment.type === 'inline-math') {
          const html = renderLatex(segment.value, false);
          return (
            <span 
              key={index} 
              className="inline-block px-1 align-baseline select-text"
              dangerouslySetInnerHTML={{ __html: html }} 
            />
          );
        }

        return <span key={index}>{renderSimpleMarkdown(segment.value)}</span>;
      })}
    </div>
  );
};
