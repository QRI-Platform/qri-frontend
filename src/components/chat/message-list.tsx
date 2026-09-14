import { useState } from "react";
import { Sparkles, Library, Brain, Wrench, ChevronDown, CheckCircle2, Loader2, FileText } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

export interface ToolTimelineEvent {
  id: string;
  tool: string;
  input?: unknown;
  output?: string;
  expanded?: boolean;
}

export interface ReasoningTimelineEvent {
  id: string;
  content: string;
  expanded?: boolean;
}

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  badge?: string;
  toolCalls?: ToolTimelineEvent[];
  reasoning?: ReasoningTimelineEvent[];
}

interface MessageListProps {
  messages: Message[];
  thinking: boolean;
}

function ReasoningItem({ entry }: { entry: ReasoningTimelineEvent }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="overflow-hidden rounded-xl border border-border/70 bg-muted/40 text-left transition-all">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between px-3.5 py-2 text-xs font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
      >
        <span className="flex items-center gap-2">
          <Brain className="h-3.5 w-3.5 text-purple-400 shrink-0" />
          <span>Thought Process / Reasoning</span>
        </span>
        <span className="flex items-center gap-1 text-[11px] opacity-80">
          <span>{isOpen ? "Hide" : "Show details"}</span>
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </span>
      </button>

      {isOpen && (
        <div className="border-t border-border/50 bg-background/40 px-3.5 py-2.5 text-xs leading-relaxed text-muted-foreground font-mono whitespace-pre-wrap max-h-60 overflow-y-auto">
          {entry.content}
        </div>
      )}
    </div>
  );
}

function ToolItem({ tool }: { tool: ToolTimelineEvent }) {
  const [isOpen, setIsOpen] = useState(true);
  const isRunning = !tool.output;

  return (
    <div className="overflow-hidden rounded-xl border border-border/70 bg-muted/30 text-left transition-all">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between px-3.5 py-2 text-xs font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
      >
        <span className="flex items-center gap-2 truncate">
          <Wrench className="h-3.5 w-3.5 text-blue-400 shrink-0" />
          <span className="truncate">
            Tool: <strong className="font-semibold text-foreground/80">{tool.tool}</strong>
          </span>
          {isRunning ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-500 font-normal">
              <Loader2 className="h-2.5 w-2.5 animate-spin" />
              Running...
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-500 font-normal">
              <CheckCircle2 className="h-2.5 w-2.5" />
              Done
            </span>
          )}
        </span>
        <span className="flex items-center gap-1 text-[11px] shrink-0 opacity-80">
          <span>{isOpen ? "Hide" : "Show"}</span>
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </span>
      </button>

      {isOpen && (
        <div className="space-y-2 border-t border-border/50 bg-background/40 px-3.5 py-2.5 text-[11px] text-muted-foreground">
          {tool.input !== undefined && tool.input !== null && (
            <div>
              <span className="font-semibold text-foreground/70 block mb-1">Input:</span>
              <pre className="overflow-x-auto whitespace-pre-wrap rounded-md bg-muted/40 p-2 font-mono text-[11px] text-foreground/90 border border-border/40 max-h-40">
                {typeof tool.input === "string" ? tool.input : JSON.stringify(tool.input, null, 2)}
              </pre>
            </div>
          )}
          {tool.output && (
            <div>
              <span className="font-semibold text-foreground/70 block mb-1">Output:</span>
              <pre className="overflow-x-auto whitespace-pre-wrap rounded-md bg-muted/40 p-2 font-mono text-[11px] text-foreground/90 border border-border/40 max-h-40">
                {String(tool.output)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * The AI writes maths as \( inline \) and \[ display \], but remark-math
 * only recognises $ and $$. Converting here keeps the fix on our side,
 * where we can verify it, rather than depending on the AI developer
 * changing their prompt.
 */
function normalizeMath(text: string): string {
  return text
    .replace(/\\\[([\s\S]*?)\\\]/g, (_match, inner: string) => `\n\n$$${inner}$$\n\n`)
    .replace(/\\\(([\s\S]*?)\\\)/g, (_match, inner: string) => `$${inner}$`);
}

const markdownComponents = {
  p: (props: React.ComponentPropsWithoutRef<"p">) => <p className="mb-2 last:mb-0" {...props} />,
  ul: (props: React.ComponentPropsWithoutRef<"ul">) => (
    <ul className="mb-2 list-disc space-y-1 pl-5 last:mb-0" {...props} />
  ),
  ol: (props: React.ComponentPropsWithoutRef<"ol">) => (
    <ol className="mb-2 list-decimal space-y-1 pl-5 last:mb-0" {...props} />
  ),
  li: (props: React.ComponentPropsWithoutRef<"li">) => <li className="leading-relaxed" {...props} />,
  strong: (props: React.ComponentPropsWithoutRef<"strong">) => (
    <strong className="font-semibold text-foreground" {...props} />
  ),
  h1: (props: React.ComponentPropsWithoutRef<"h1">) => (
    <h1 className="mb-2 mt-3 text-base font-bold first:mt-0" {...props} />
  ),
  h2: (props: React.ComponentPropsWithoutRef<"h2">) => (
    <h2 className="mb-2 mt-3 text-sm font-bold first:mt-0" {...props} />
  ),
  h3: (props: React.ComponentPropsWithoutRef<"h3">) => (
    <h3 className="mb-1.5 mt-3 text-sm font-semibold first:mt-0" {...props} />
  ),
  blockquote: (props: React.ComponentPropsWithoutRef<"blockquote">) => (
    <blockquote
      className="mb-2 border-l-2 border-[var(--brand-teal)] pl-3 italic last:mb-0"
      {...props}
    />
  ),
  code: (props: React.ComponentPropsWithoutRef<"code">) => (
    <code className="rounded bg-background/60 px-1 py-0.5 font-mono text-[0.85em]" {...props} />
  ),
  pre: (props: React.ComponentPropsWithoutRef<"pre">) => (
    <pre className="mb-2 overflow-x-auto rounded-lg bg-background/60 p-3 last:mb-0" {...props} />
  ),
  table: (props: React.ComponentPropsWithoutRef<"table">) => (
    <div className="mb-2 overflow-x-auto last:mb-0">
      <table className="w-full border-collapse text-left" {...props} />
    </div>
  ),
  th: (props: React.ComponentPropsWithoutRef<"th">) => (
    <th className="border border-border px-2 py-1 font-semibold" {...props} />
  ),
  td: (props: React.ComponentPropsWithoutRef<"td">) => (
    <td className="border border-border px-2 py-1" {...props} />
  ),
};

export function MessageList({ messages, thinking }: MessageListProps) {
  const isEmpty = messages.length === 0 && !thinking;

  if (isEmpty) {
    return (
      <div className="flex flex-1 items-center justify-center overflow-y-auto p-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--brand-blue)] via-[var(--brand-navy)] to-[var(--brand-teal)] text-white shadow-lg shadow-blue-500/20">
            <Sparkles className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold">Ask your first question</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Type, upload a photo or PDF, or use your voice.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="mx-auto max-w-3xl space-y-4">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className="max-w-[80%]">
              {m.role === "system" ? (
                <div className="flex items-center gap-3 rounded-xl border border-border bg-secondary/60 px-3.5 py-2.5 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4 shrink-0 text-[var(--brand-blue)]" />
                  <span>{m.content.replace(/^user uploaded document:\s*/i, "Uploaded file: ")}</span>
                </div>
              ) : (
              <>
              {m.role === "assistant" && m.badge && (
                <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-[var(--brand-teal)]/10 px-2.5 py-1 text-[11px] font-semibold text-[var(--brand-teal)]">
                  <Library className="h-3 w-3" />
                  {m.badge}
                </span>
              )}

              {m.role === "user" ? (
                <p className="rounded-2xl rounded-br-sm bg-[var(--brand-blue)] px-4 py-2.5 text-sm leading-relaxed text-white">
                  {m.content}
                </p>
              ) : (
                <div className="space-y-2">
                  {(m.toolCalls ?? []).length > 0 && (
                    <div className="space-y-2">
                      {m.toolCalls?.map((tool) => (
                        <ToolItem key={tool.id} tool={tool} />
                      ))}
                    </div>
                  )}

                  {(m.reasoning ?? []).length > 0 && (
                    <div className="space-y-2">
                      {m.reasoning?.map((entry) => (
                        <ReasoningItem key={entry.id} entry={entry} />
                      ))}
                    </div>
                  )}

                  {m.content && (
                    <div className="overflow-x-auto rounded-2xl rounded-bl-sm bg-secondary px-4 py-2.5 text-sm leading-relaxed text-foreground">
                      <ReactMarkdown
                        remarkPlugins={[remarkMath, remarkGfm]}
                        rehypePlugins={[rehypeKatex]}
                        components={markdownComponents}
                      >
                        {normalizeMath(m.content)}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              )}
              </>
              )}
            </div>
          </div>
        ))}

        {thinking && (
          <div className="flex justify-start">
            <p className="rounded-2xl rounded-bl-sm bg-secondary px-4 py-2.5 text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--brand-blue)]" />
              Thinking...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}