"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { getConversation, sendMessage } from "@/lib/api/conversation";
import { getCurrentUser } from "@/lib/utils/auth-utils";

export default function ConversationPage() {
  const params = useParams();
  const router = useRouter();
  const convId = params.id as string;
  const [conversation, setConversation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.push('/login');
      return;
    }

    const load = async () => {
      try {
        const data = await getConversation(convId);
        setConversation(data);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      } catch (err: any) {
        setError(err?.response?.data?.error || err?.message || 'Failed to load conversation');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [convId, router]);

  const handleSend = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      const data = await sendMessage(convId, text.trim());
      setConversation(data);
      setText("");
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    } catch (err: any) {
      alert(err?.response?.data?.error || err?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .chat-input:focus { outline: none; border-color: #1e3a8a; }
      `}</style>
      
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '14px 20px', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button 
            onClick={() => router.back()} 
            style={{ 
              background: 'none', 
              border: 'none', 
              color: '#1e3a8a', 
              cursor: 'pointer',
              fontSize: '1.5rem',
              padding: '4px 8px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            ←
          </button>
          {conversation && (() => {
            const currentUserId = String(getCurrentUser()?.id || getCurrentUser()?._id || '');
            const otherParticipant = conversation.participants.find((p: any) => {
              const pId = String(p?._id || p?.id || p || '');
              return pId && currentUserId && pId !== currentUserId;
            }) || conversation.participants[0];
            
            return (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ 
                  width: 40, 
                  height: 40, 
                  borderRadius: '50%', 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '1rem'
                }}>
                  {otherParticipant?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.9375rem' }}>
                    {otherParticipant?.name || otherParticipant?.email || 'User'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Active now</div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, maxWidth: 900, margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column' }}>
        {loading && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 32, height: 32, border: '3px solid #e2e8f0', borderTopColor: '#1e3a8a', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
              <p style={{ color: '#64748b', margin: 0 }}>Loading...</p>
            </div>
          </div>
        )}
        
        {error && (
          <div style={{ padding: 16, margin: 20, background: '#fee2e2', color: '#991b1b', borderRadius: 12 }}>{error}</div>
        )}
        
        {!loading && !error && conversation && (
          <>
            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', background: '#f8fafc' }}>
              {conversation.messages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>👋</div>
                  <p style={{ color: '#64748b', margin: 0 }}>No messages yet. Say hello!</p>
                </div>
              ) : (
                <div>
                  {conversation.messages.map((m: any, idx: number) => {
                    const currentUserId = String(getCurrentUser()?.id || getCurrentUser()?._id || '');
                    const messageSenderId = String(m.sender?._id || m.sender?.id || m.sender || '');
                    const mine = currentUserId && messageSenderId && messageSenderId === currentUserId;
                    
                    const senderName = mine 
                      ? 'You' 
                      : (m.sender?.name || conversation.participants.find((p: any) => {
                          const pId = String(p?._id || p?.id || '');
                          return pId === messageSenderId;
                        })?.name || 'User');
                    
                    return (
                      <div key={idx} style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
                        <div style={{ maxWidth: '70%' }}>
                          {!mine && (
                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: 4, paddingLeft: 4, fontWeight: 500 }}>
                              {senderName}
                            </div>
                          )}
                          <div style={{ 
                            background: mine ? 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)' : '#fff', 
                            color: mine ? '#fff' : '#0f172a', 
                            padding: '10px 14px', 
                            borderRadius: mine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                            border: mine ? 'none' : '1px solid #e2e8f0'
                          }}>
                            <div style={{ fontSize: '0.9375rem', lineHeight: 1.5, wordBreak: 'break-word' }}>{m.content}</div>
                            <div style={{ fontSize: '0.6875rem', color: mine ? 'rgba(255,255,255,0.75)' : '#9ca3af', marginTop: 6, textAlign: 'right' }}>
                              {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>
              )}
            </div>

            {/* Input */}
            <div style={{ background: '#fff', borderTop: '1px solid #e2e8f0', padding: '16px 20px' }}>
              <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                <input 
                  value={text} 
                  onChange={e => setText(e.target.value)} 
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder="Type a message..." 
                  className="chat-input"
                  style={{ 
                    flex: 1, 
                    padding: '12px 16px', 
                    borderRadius: 24, 
                    border: '1px solid #e2e8f0',
                    fontSize: '0.9375rem',
                    transition: 'border-color 0.2s'
                  }} 
                />
                <button 
                  disabled={sending || !text.trim()} 
                  onClick={handleSend} 
                  style={{ 
                    background: sending || !text.trim() ? '#9ca3af' : 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)', 
                    color: '#fff', 
                    border: 'none', 
                    borderRadius: '50%', 
                    width: 44,
                    height: 44,
                    cursor: sending || !text.trim() ? 'not-allowed' : 'pointer',
                    fontSize: '1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                    boxShadow: sending || !text.trim() ? 'none' : '0 2px 8px rgba(30, 58, 138, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    if (!sending && text.trim()) {
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  {sending ? '...' : '→'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}