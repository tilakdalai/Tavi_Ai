import React, { useRef, useEffect } from 'react';
import MessageItem from './MessageItem.jsx';

export default function MessageList({
  messages = [],
  isStreaming = false,
  streamingContent = '',
  streamingCitations = [],
  streamingStatus = null,
  onRegenerate,
}) {
  const scrollEndRef = useRef(null);

  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent, isStreaming, streamingStatus]);

  return (
    <div className="flex-1 overflow-y-auto divide-y dark:divide-slate-800/40 divide-slate-200/80 transition-colors">
      {messages.map((msg, index) => (
        <MessageItem
          key={msg._id || index}
          message={msg}
          onRegenerate={
            index === messages.length - 1 && msg.role === 'assistant'
              ? onRegenerate
              : undefined
          }
        />
      ))}

      {/* Active Streaming Message */}
      {isStreaming && (
        <MessageItem
          message={{
            role: 'assistant',
            content: streamingContent || (streamingStatus ? '' : 'Tavi is generating response...'),
            citations: streamingCitations,
            createdAt: new Date().toISOString(),
          }}
          isStreaming={true}
          streamingStatus={streamingStatus}
        />
      )}

      <div ref={scrollEndRef} className="h-6" />
    </div>
  );
}

