"use client";

import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

/**
 * The AI writes maths as \( inline \) and \[ display \], but
 * remark-math only recognises $ and $$.
 *
 * Same conversion as the chat's message list. Kept in both places
 * rather than shared, because the two render very differently - chat
 * needs full markdown, questions need only maths.
 */
function normalizeMath(text: string): string {
  return text
    .replace(/\\\[([\s\S]*?)\\\]/g, (_m, inner: string) => `\n\n$$${inner}$$\n\n`)
    .replace(/\\\(([\s\S]*?)\\\)/g, (_m, inner: string) => `$${inner}$`);
}

/**
 * Renders question and option text, which routinely contains LaTeX -
 * a maths question showing \(\sqrt{144}\) as raw code is unusable.
 *
 * Paragraphs render inline so a one-line option doesn't get block
 * spacing inside a button.
 */
export function MathText({ children }: { children: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={{
        p: (props) => <span {...props} />,
        strong: (props) => <strong className="font-semibold" {...props} />,
      }}
    >
      {normalizeMath(children)}
    </ReactMarkdown>
  );
}