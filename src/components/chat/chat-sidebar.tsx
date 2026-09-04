"use client";

import { motion } from "framer-motion";
import { Plus, MessageSquare, PanelLeftClose, Trash2 } from "lucide-react";

export interface ChatSession {
  id: string;
  title: string;
}

interface ChatSidebarProps {
  open: boolean;
  onClose: () => void;
  collapsed: boolean;
  onCollapse: () => void;
  chats: ChatSession[];
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
}

export function ChatSidebar({
  open,
  onClose,
  collapsed,
  onCollapse,
  chats,
  activeChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
}: ChatSidebarProps) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <motion.aside
        animate={{ width: collapsed ? 0 : 256 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed inset-y-0 left-0 z-[60] flex shrink-0 overflow-hidden border-r border-border bg-background transition-transform duration-300 lg:static lg:z-auto lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full w-64 shrink-0 flex-col">
          <div className="flex items-center gap-1 p-2.5">
            <button
              onClick={onNewChat}
              className="flex flex-1 items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium text-foreground transition hover:bg-secondary"
            >
              <Plus className="h-4 w-4" />
              New chat
            </button>
            <button
              onClick={onCollapse}
              aria-label="Collapse sidebar"
              className="hidden shrink-0 rounded-lg p-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground lg:flex"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-2 pb-3">
            <p className="px-2.5 py-1.5 text-xs font-medium text-muted-foreground">Recent</p>
            <div className="space-y-0.5">
              {chats.map((chat) => (
                /**
                 * A div rather than a button, because a button can't
                 * contain another button - the delete control needs to
                 * be separately clickable.
                 *
                 * `group` lets the delete icon appear on hover on
                 * desktop. It stays visible on touch screens, where
                 * there is no hover.
                 */
                <div
                  key={chat.id}
                  className={`group flex items-center gap-1 rounded-lg pr-1 transition ${
                    chat.id === activeChatId ? "bg-secondary" : "hover:bg-secondary"
                  }`}
                >
                  <button
                    onClick={() => onSelectChat(chat.id)}
                    className={`flex min-w-0 flex-1 items-center gap-2 px-2.5 py-1.5 text-left text-sm ${
                      chat.id === activeChatId ? "font-medium" : ""
                    }`}
                  >
                    <MessageSquare className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="flex-1 truncate">{chat.title}</span>
                  </button>

                  <button
                    onClick={() => onDeleteChat(chat.id)}
                    aria-label={`Delete ${chat.title}`}
                    className="shrink-0 rounded-md p-1.5 text-muted-foreground opacity-100 transition hover:bg-destructive/10 hover:text-destructive lg:opacity-0 lg:group-hover:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.aside>
    </>
  );
}