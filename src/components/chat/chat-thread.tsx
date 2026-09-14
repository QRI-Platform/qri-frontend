"use client";

import { useRef, useState, type ChangeEvent } from "react";
import {
  Menu,
  Camera,
  Mic,
  Paperclip,
  ArrowUp,
  PanelLeftOpen,
  Image as ImageIcon,
  FileText,
  X,
} from "lucide-react";
import { MessageList, type Message, type ToolTimelineEvent, type ReasoningTimelineEvent } from "./message-list";
import { apiFetch } from "@/lib/api";
import { useSpeechInput } from "@/lib/use-speech-input";
import { apiStream } from "@/lib/api";

export interface SelectedFile {
  id: string;
  name: string;
  type: "image" | "pdf" | "document";
  url?: string;
  sizeLabel: string;
  status: "uploading" | "ready" | "failed";
  error?: string;
}

interface SendMessageResponse {
  userMessage: { id: string; content: string };
  assistantMessage: { id: string; content: string; source: string | null };
}

interface ChatThreadProps {
  chatId: string | null;
  onOpenSidebar: () => void;
  sidebarCollapsed: boolean;
  onExpandSidebar: () => void;
  attachedFiles: SelectedFile[];
  /**
   * Takes both the display metadata and the raw File. The page needs the
   * raw file to actually upload it; this component only needs the
   * metadata to render the chip.
   */
  onFileSelected: (file: SelectedFile, rawFile: File) => void;
  onOpenPreview: (file: SelectedFile) => void;
  onRemoveAttachment: (file: SelectedFile) => void;
  messages: Message[];
  onMessagesAppended: (newMessages: Message[]) => void;
  onMessageUpdated: (id: string, patch: Partial<Message>) => void;
  onTitleUpdated: (title: string) => void;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ChatThread({
  chatId,
  onOpenSidebar,
  sidebarCollapsed,
  onExpandSidebar,
  attachedFiles,
  onFileSelected,
  onOpenPreview,
  onRemoveAttachment,
  messages,
  onMessagesAppended,
  onMessageUpdated,
  onTitleUpdated,
}: ChatThreadProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [sendError, setSendError] = useState("");

  const { isListening, error: voiceError, startListening, stopListening } = useSpeechInput();

  const isUploading = attachedFiles.some((f) => f.status === "uploading");
  const failedFiles = attachedFiles.filter((f) => f.status === "failed" && f.error);

    async function handleSend() {
    const text = input.trim();
    if (!text || !chatId) return;
    if (isUploading) return;

    setInput("");
    setSendError("");
    setThinking(true);

    /**
     * A temporary id so the message can be rendered and updated before
     * the server has told us its real one. Replaced when the stream
     * finishes.
     */
    const tempId = `pending-${crypto.randomUUID()}`;
    let started = false;
    let streamed = "";
    const toolCalls: ToolTimelineEvent[] = [];
    const reasoning: ReasoningTimelineEvent[] = [];

    const failure = await apiStream(
      `/api/chats/${chatId}/messages/stream`,
      { content: text },
      (event) => {
        if (event.type === "start" && event.userMessageId) {
          setThinking(false);
          started = true;
          onMessagesAppended([
            { id: event.userMessageId, role: "user", content: text },
            {
              id: tempId,
              role: "assistant",
              content: "",
              badge: "AI answer",
              toolCalls: [],
              reasoning: [],
            },
          ]);
          return;
        }

        if (event.type === "tool_start") {
          setThinking(false);
          const toolName = event.tool ?? event.name ?? "Tool";
          const toolInput = event.input ?? event.data?.input;

          const existingIdx = toolCalls.findIndex((t) => t.tool === toolName && !t.output);
          if (existingIdx >= 0) {
            toolCalls[existingIdx] = {
              ...toolCalls[existingIdx],
              input: toolInput ?? toolCalls[existingIdx].input,
            };
          } else {
            toolCalls.push({
              id: `${tempId}-tool-${toolCalls.length + 1}`,
              tool: toolName,
              input: toolInput,
              output: undefined,
              expanded: true,
            });
          }
          onMessageUpdated(tempId, { toolCalls: [...toolCalls], reasoning: [...reasoning] });
          return;
        }

        if (event.type === "tool_end") {
          setThinking(false);
          const toolName = event.tool ?? event.name ?? "Tool";
          const rawOutput = event.output ?? event.data?.output;
          const outputStr = typeof rawOutput === "string" ? rawOutput : JSON.stringify(rawOutput ?? "");

          const index = toolCalls.findLastIndex((entry) => entry.tool === toolName);
          if (index >= 0) {
            toolCalls[index] = {
              ...toolCalls[index],
              output: outputStr,
            };
          } else {
            toolCalls.push({
              id: `${tempId}-tool-${toolCalls.length + 1}`,
              tool: toolName,
              output: outputStr,
              expanded: true,
            });
          }
          onMessageUpdated(tempId, { toolCalls: [...toolCalls], reasoning: [...reasoning] });
          return;
        }

        if (event.type === "reasoning") {
          setThinking(false);
          const chunk = String(event.content ?? "");
          if (!chunk) return;

          if (reasoning.length === 0) {
            reasoning.push({
              id: `${tempId}-reasoning-1`,
              content: chunk,
              expanded: true,
            });
          } else {
            reasoning[reasoning.length - 1] = {
              ...reasoning[reasoning.length - 1],
              content: reasoning[reasoning.length - 1].content + chunk,
            };
          }
          onMessageUpdated(tempId, { reasoning: [...reasoning], toolCalls: [...toolCalls] });
          return;
        }

        if (event.type === "token" && event.content) {
          setThinking(false);
          streamed += event.content;
          onMessageUpdated(tempId, {
            content: streamed,
            toolCalls: [...toolCalls],
            reasoning: [...reasoning],
          });
          return;
        }

        if (event.type === "final") {
          setThinking(false);
          const finalContent = event.ai_response ?? event.content ?? streamed;
          if (finalContent) {
            streamed = finalContent;
            onMessageUpdated(tempId, {
              content: finalContent,
              toolCalls: [...toolCalls],
              reasoning: [...reasoning],
            });
          }
          return;
        }

        if (event.type === "error") {
          setThinking(false);
          setSendError(event.message ?? event.content ?? "Something went wrong");
          onMessageUpdated(tempId, {
            content: event.message ?? event.content ?? "Something went wrong",
            toolCalls: [...toolCalls],
            reasoning: [...reasoning],
          });
          return;
        }

        if (event.type === "done") {
          setThinking(false);
          if (event.title) onTitleUpdated(event.title);
          onMessageUpdated(tempId, {
            id: event.assistantMessageId ?? tempId,
            content: event.content ?? streamed,
            toolCalls: [...toolCalls],
            reasoning: [...reasoning],
          });
        }
      },
    );

    setThinking(false);

    if (failure) {
      // Only reachable if it failed before streaming began - otherwise
      // the error arrived as an event.
      if (!started) setSendError(failure);
      return;
    }
  }

  function handleImagePick(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    for (const file of files) {
      onFileSelected(
        {
          id: crypto.randomUUID(),
          name: file.name,
          type: "image",
          url: URL.createObjectURL(file),
          sizeLabel: formatSize(file.size),
          status: "uploading",
        },
        file,
      );
    }
    e.target.value = "";
  }

  function handleDocPick(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    for (const file of files) {
      const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
      onFileSelected(
        {
          id: crypto.randomUUID(),
          name: file.name,
          type: isPdf ? "pdf" : "document",
          url: isPdf ? URL.createObjectURL(file) : undefined,
          sizeLabel: formatSize(file.size),
          status: "uploading",
        },
        file,
      );
    }
    e.target.value = "";
  }

  function handleMicClick() {
    if (isListening) {
      stopListening();
      return;
    }
    startListening((transcript) => {
      setInput(transcript);
    });
  }

  return (
    <div className="relative flex min-w-0 flex-1 flex-col">
      <div className="flex items-center gap-2 border-b border-border p-3 lg:hidden">
        <button
          onClick={onOpenSidebar}
          aria-label="Open chats"
          className="rounded-lg p-1.5 hover:bg-secondary"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="text-sm font-semibold">New chat</span>
      </div>

      {sidebarCollapsed && (
        <button
          onClick={onExpandSidebar}
          aria-label="Expand sidebar"
          className="absolute left-3 top-3 z-10 hidden rounded-lg border border-border bg-card p-2 text-muted-foreground shadow-sm transition hover:bg-secondary hover:text-foreground lg:flex"
        >
          <PanelLeftOpen className="h-4 w-4" />
        </button>
      )}

      <MessageList messages={messages} thinking={thinking} />

      <div className="border-t border-border p-4">
        <div className="mx-auto max-w-3xl">
          {attachedFiles.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {attachedFiles.map((file) => (
                <button
                  key={file.id}
                  onClick={() => onOpenPreview(file)}
                  className="flex w-fit items-center gap-2 rounded-lg border border-border bg-secondary px-3 py-1.5 text-xs font-medium transition hover:bg-secondary/70"
                >
                  {file.type === "image" ? (
                    <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  ) : (
                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                  <span className="max-w-[160px] truncate">{file.name}</span>
                  {file.status === "uploading" && (
                    <span className="text-[var(--brand-blue)]">Reading...</span>
                  )}
                  {file.status === "failed" && (
                    <span className="text-destructive">Couldn&apos;t read</span>
                  )}
                  <span
                    role="button"
                    aria-label="Remove attachment"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveAttachment(file);
                    }}
                    className="ml-1 rounded-full p-0.5 hover:bg-border"
                  >
                    <X className="h-3 w-3" />
                  </span>
                </button>
              ))}
            </div>
          )}

          {sendError && <p className="mb-2 text-xs text-destructive">{sendError}</p>}
          {voiceError && <p className="mb-2 text-xs text-destructive">{voiceError}</p>}
          {isUploading && (
            <p className="mb-2 text-xs text-muted-foreground">
              Reading your file - photos can take a minute or two.
            </p>
          )}
          {failedFiles.map((f) => (
            <p key={f.id} className="mb-2 text-xs text-destructive">
              {f.name}: {f.error}
            </p>
          ))}
          {isListening && (
            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-[var(--brand-blue)]">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--brand-blue)] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--brand-blue)]" />
              </span>
              Listening...
            </p>
          )}

          <div className="flex items-end gap-2 rounded-2xl border border-border bg-card p-2 shadow-sm">
            <button
              onClick={() => imageInputRef.current?.click()}
              aria-label="Upload a photo"
              className="shrink-0 rounded-xl p-2.5 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            >
              <Camera className="h-5 w-5" />
            </button>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImagePick}
            />

            <button
              onClick={() => docInputRef.current?.click()}
              aria-label="Upload a document or PDF"
              className="shrink-0 rounded-xl p-2.5 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            >
              <Paperclip className="h-5 w-5" />
            </button>
            <input
              ref={docInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              multiple
              className="hidden"
              onChange={handleDocPick}
            />

            <button
              onClick={handleMicClick}
              aria-label={isListening ? "Stop listening" : "Ask by voice"}
              className={`shrink-0 rounded-xl p-2.5 transition ${
                isListening
                  ? "bg-[var(--brand-blue)]/10 text-[var(--brand-blue)]"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <Mic className="h-5 w-5" />
            </button>

            <textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask anything..."
              className="max-h-32 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-muted-foreground"
            />

            <button
              onClick={handleSend}
              disabled={!input.trim() || !chatId || isUploading}
              aria-label="Send"
              className="shrink-0 rounded-xl bg-[var(--brand-blue)] p-2.5 text-white transition hover:opacity-90 disabled:opacity-40"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}