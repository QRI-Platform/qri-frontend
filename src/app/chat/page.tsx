"use client";

import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { AppHeader } from "@/components/app/app-header";
import { ChatSidebar, type ChatSession } from "@/components/chat/chat-sidebar";
import { ChatThread, type SelectedFile } from "@/components/chat/chat-thread";
import { UploadPanel } from "@/components/chat/upload-panel";
import type { Message } from "@/components/chat/message-list";
import { apiFetch, apiUpload } from "@/lib/api";
import { resizeImage } from "@/lib/image-resize";
import { useRequirePlan } from "@/lib/use-require-plan";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface BackendMessage {
  id: string;
  role: "USER" | "ASSISTANT" | "SYSTEM";
  content: string;
  source: "LIBRARY" | "AI" | null;
}

function toFrontendMessage(m: BackendMessage): Message {
  return {
    id: m.id,
    role: m.role === "USER" ? "user" : "assistant",
    content: m.content,
    badge:
      m.role === "ASSISTANT"
        ? m.source === "LIBRARY"
          ? "QRI library"
          : "QRI AI response.."
        : undefined,
  };
}

export default function ChatPage() {
  const ready = useRequirePlan() === "allowed";
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [chats, setChats] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeMessages, setActiveMessages] = useState<Message[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  const [attachedFiles, setAttachedFiles] = useState<SelectedFile[]>([]);
  const [previewFile, setPreviewFile] = useState<SelectedFile | null>(null);
  const [previewKey, setPreviewKey] = useState(0);
    // The chat awaiting delete confirmation, if any.
  const [chatToDelete, setChatToDelete] = useState<ChatSession | null>(null);
  const [chatToRename, setChatToRename] = useState<ChatSession | null>(null);
  const [renameTitle, setRenameTitle] = useState("");

  useEffect(() => {
    if (!ready) return;
    void bootstrapChats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  async function fetchChatList(): Promise<ChatSession[]> {
    const result = await apiFetch<{ chats: ChatSession[] }>("/api/chats");
    return result.ok ? result.data.chats : [];
  }

  async function bootstrapChats() {
    setLoadingInitial(true);

    let list = await fetchChatList();

    // Brand-new student with no chats yet - start them off with one.
    if (list.length === 0) {
      await apiFetch("/api/chats", { method: "POST" });
      list = await fetchChatList();
    }

    setChats(list);

    if (list[0]) {
      await selectChat(list[0].id);
    }

    setLoadingInitial(false);
  }

  async function selectChat(id: string) {
    setActiveChatId(id);
    setAttachedFiles([]);
    setPreviewFile(null);
    setSidebarOpen(false);

    const result = await apiFetch<{ chat: { messages: BackendMessage[] } }>(`/api/chats/${id}`);
    if (!result.ok) return;

    setActiveMessages(result.data.chat.messages.map(toFrontendMessage));
  }

  async function handleNewChat() {
    const result = await apiFetch<{ chat: ChatSession }>("/api/chats", { method: "POST" });
    if (!result.ok) return;

    setChats((prev) => [result.data.chat, ...prev]);
    await selectChat(result.data.chat.id);
  }

  function requestRenameChat(id: string) {
    const chat = chats.find((item) => item.id === id);
    if (!chat) return;

    setChatToRename(chat);
    setRenameTitle(chat.title);
  }

  async function confirmRenameChat() {
    const chat = chatToRename;
    const title = renameTitle.trim();
    if (!chat || !title || title === chat.title) {
      setChatToRename(null);
      return;
    }

    const result = await apiFetch<{ chat: ChatSession }>(`/api/chats/${chat.id}/title`, {
      method: "PATCH",
      body: JSON.stringify({ title }),
    });
    if (!result.ok) return;

    setChats((prev) => prev.map((item) => (item.id === chat.id ? result.data.chat : item)));
    setChatToRename(null);
  }

     function requestDeleteChat(id: string) {
    const chat = chats.find((c) => c.id === id);
    if (chat) setChatToDelete(chat);
  }

  async function confirmDeleteChat() {
    const chat = chatToDelete;
    if (!chat) return;
    setChatToDelete(null);

    const result = await apiFetch(`/api/chats/${chat.id}`, { method: "DELETE" });
    if (!result.ok) return;

    const remaining = chats.filter((c) => c.id !== chat.id);
    setChats(remaining);

    // Deleting a chat the student wasn't looking at shouldn't move them.
    if (chat.id !== activeChatId) return;

    if (remaining[0]) {
      await selectChat(remaining[0].id);
    } else {
      // That was the last one. Start a fresh chat rather than leaving an
      // empty screen - the same thing a brand-new student gets.
      await handleNewChat();
    }
  }

  function handleMessagesAppended(newMessages: Message[]) {
    setActiveMessages((prev) => [...prev, ...newMessages]);

    // Bump the active chat to the top of the sidebar list, matching the
    // updatedAt bump the backend just did.
    setChats((prev) => {
      const current = prev.find((c) => c.id === activeChatId);
      if (!current) return prev;
      return [current, ...prev.filter((c) => c.id !== activeChatId)];
    });
  }
    /**
   * Patches a message that's already rendered. Used during streaming,
   * where the same message grows token by token and finally gets its
   * real id.
   */
  function handleMessageUpdated(id: string, patch: Partial<Message>) {
    setActiveMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }

      async function handleFileSelected(file: SelectedFile, rawFile: File) {
    setAttachedFiles((prev) => [...prev, file]);
    setPreviewFile(file);
    setPreviewKey((k) => k + 1);

    if (!activeChatId) return;

    // Shrink photos before sending - OCR cost scales with pixel count,
    // and a full-resolution phone photo takes minutes on CPU.
    const toUpload = await resizeImage(rawFile);

    const form = new FormData();
    form.append("files", toUpload, toUpload.name);

    const result = await apiUpload(`/api/chats/${activeChatId}/upload`, form);

    setAttachedFiles((prev) =>
      prev.map((f) =>
        f.id === file.id
          ? {
              ...f,
              status: result.ok ? "ready" : "failed",
              error: result.ok ? undefined : result.error.message,
            }
          : f,
      ),
    );
  }

  function handleOpenPreview(file: SelectedFile) {
    setPreviewFile(file);
    setPreviewKey((k) => k + 1);
  }

  function handleRemoveAttachment(file: SelectedFile) {
    setAttachedFiles((prev) => prev.filter((f) => f.id !== file.id));
    setPreviewFile((current) => (current?.id === file.id ? null : current));
  }

  if (!ready) return null;

  if (loadingInitial) {
    return (
      <div className="flex h-screen flex-col overflow-hidden">
        <AppHeader />
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-muted-foreground">Loading your chats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <AppHeader />

      <div className="flex min-h-0 flex-1">
        <ChatSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          collapsed={sidebarCollapsed}
          onCollapse={() => setSidebarCollapsed(true)}
          chats={chats}
          activeChatId={activeChatId}
          onSelectChat={selectChat}
          onNewChat={handleNewChat}
          onRenameChat={requestRenameChat}
          onDeleteChat={requestDeleteChat}   
               />

        <ChatThread
          key={activeChatId}
          chatId={activeChatId}
          onOpenSidebar={() => setSidebarOpen(true)}
          sidebarCollapsed={sidebarCollapsed}
          onExpandSidebar={() => setSidebarCollapsed(false)}
          attachedFiles={attachedFiles}
          onFileSelected={handleFileSelected}
          onOpenPreview={handleOpenPreview}
          onRemoveAttachment={handleRemoveAttachment}
          messages={activeMessages}
          onMessagesAppended={handleMessagesAppended}
          onMessageUpdated={handleMessageUpdated}
          onTitleUpdated={(title) => {
            if (!activeChatId) return;
            setChats((prev) => prev.map((chat) => (chat.id === activeChatId ? { ...chat, title } : chat)));
          }}
        />

                <AnimatePresence>
          {previewFile && (
            <UploadPanel key={previewKey} file={previewFile} onClose={() => setPreviewFile(null)} />
          )}
        </AnimatePresence>
      </div>

      <ConfirmDialog
        open={chatToDelete !== null}
        title="Delete this chat?"
        message={`"${chatToDelete?.title ?? ""}" and all the questions and answers in it will be permanently deleted. This can't be undone.`}
        confirmLabel="Delete chat"
        onConfirm={confirmDeleteChat}
        onCancel={() => setChatToDelete(null)}
      />

      {chatToRename && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button
            className="absolute inset-0 bg-black/50"
            aria-label="Cancel rename"
            onClick={() => setChatToRename(null)}
          />
          <form
            className="relative w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-xl"
            onSubmit={(event) => {
              event.preventDefault();
              void confirmRenameChat();
            }}
          >
            <h2 className="text-sm font-bold">Rename chat</h2>
            <input
              autoFocus
              value={renameTitle}
              maxLength={80}
              onChange={(event) => setRenameTitle(event.target.value)}
              className="mt-4 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              aria-label="Chat title"
            />
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setChatToRename(null)}
                className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold transition hover:bg-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!renameTitle.trim()}
                className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Rename
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
  