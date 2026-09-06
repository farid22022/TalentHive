import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { MessageSquare, Send } from 'lucide-react';
import { useConversations, useConversationMessages, useMarkConversationRead, useSendMessage } from '../services/messages.js';
import { useSocket } from '../context/SocketContext.jsx';

export default function Messages() {
  const { conversationId } = useParams();
  const { data: conversations = [] } = useConversations();
  const currentId = conversationId || conversations[0]?._id;
  const { data: messages = [] } = useConversationMessages(currentId);
  const [text, setText] = useState('');
  const [search, setSearch] = useState('');
  const send = useSendMessage();
  const read = useMarkConversationRead();
  const { socket } = useSocket() || {};

  useEffect(() => {
    if (currentId) read.mutate(currentId);
  }, [currentId]);

  useEffect(() => {
    if (!socket || !currentId) return;
    socket.emit('join_conversation', { conversationId: currentId });
    const onNew = () => read.mutate(currentId);
    socket.on('new_message', onNew);
    return () => {
      socket.emit('leave_conversation', { conversationId: currentId });
      socket.off('new_message', onNew);
    };
  }, [socket, currentId]);

  const current = useMemo(() => conversations.find((c) => c._id === currentId), [conversations, currentId]);

  const submit = async (e) => {
    e.preventDefault();
    if (!currentId || !text.trim()) return;
    await send.mutateAsync({ conversationId: currentId, text });
    setText('');
  };

  return (
    <div className="grid min-h-[70vh] gap-4 lg:grid-cols-[320px,1fr]">
      <aside className="rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-4"><div className="font-semibold">Conversations</div><input value={search} onChange={(e) => setSearch(e.target.value)} className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Search conversations" /></div>
        <div className="max-h-[70vh] overflow-auto">
          {conversations.filter((c) => !search || (c.title || c.job?.title || c.proposal?.job?.title || '').toLowerCase().includes(search.toLowerCase())).map((c) => (
            <Link
              key={c._id}
              to={`/dashboard/messages/${c._id}`}
              className={`block border-b border-slate-100 p-4 hover:bg-slate-50 ${c._id === currentId ? 'bg-brand-50' : ''}`}
            >
              <div className="font-medium text-slate-900">{c.job?.title || c.proposal?.job?.title || 'Conversation'}</div>
              <div className="text-sm text-slate-500">{c.lastMessage?.text || 'No messages yet'}</div>
            </Link>
          ))}
          {!conversations.length && <div className="p-6 text-sm text-slate-500">No messages yet.</div>}
        </div>
      </aside>
      <section className="flex min-h-[70vh] flex-col rounded-xl border border-slate-200 bg-white">
        <header className="border-b border-slate-200 p-4">
          <div className="flex items-center gap-2 font-semibold">
            <MessageSquare className="h-4 w-4" />
            {current?.job?.title || current?.proposal?.job?.title || 'Select a conversation'}
          </div>
        </header>
        <div className="flex-1 space-y-3 overflow-auto p-4">
          {messages.map((m) => (
            <div key={m._id} className="max-w-2xl rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="text-xs text-slate-400">{m.sender?.name || 'User'}</div>
              <div className="mt-1 text-sm text-slate-900">{m.text}</div>
            </div>
          ))}
        </div>
        <form onSubmit={submit} className="border-t border-slate-200 p-4">
          <div className="flex items-end gap-3">
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} className="min-h-12 flex-1 rounded-lg border border-slate-300 p-3 text-sm" placeholder="Type a message..." />
            <button className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-3 text-sm font-medium text-white" disabled={!currentId || send.isPending}>
              <Send className="h-4 w-4" /> Send
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
