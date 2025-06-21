import React, { useState, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import { Send, X } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AIThinkingLoader } from '@/components/AIThinkingLoader';
import Image from 'next/image';
import type { Attachment, Message } from 'ai';
import { ChatMessage } from '@/lib/diagram-storage';

interface ChatProps {
  imageUrl: string | null;
  onRatingUpdate: (rating: number) => void;
  onFirstAnalysis?: (content: string) => void;
  selectedArea?: string | null;
  onClearSelectedArea?: () => void;
  initialMessages?: ChatMessage[];
  onChatUpdate?: (messages: ChatMessage[]) => void;
}

export function Chat({ imageUrl, onRatingUpdate, onFirstAnalysis, selectedArea, onClearSelectedArea, initialMessages = [], onChatUpdate }: ChatProps) {
  // Convert ChatMessage to AI SDK Message format
  const convertToAIMessages = (chatMessages: ChatMessage[]): Message[] => {
    return chatMessages.map(msg => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      createdAt: msg.timestamp,
    }))
  }

  // Convert AI SDK Message to ChatMessage format
  const convertToChatMessages = (aiMessages: Message[]): ChatMessage[] => {
    return aiMessages.map(msg => ({
      id: msg.id,
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
      timestamp: msg.createdAt || new Date(),
    }))
  }

  const { messages, input, handleInputChange, handleSubmit, isLoading, setInput, status, setMessages } = useChat({
    api: '/api/chat',
    initialMessages: convertToAIMessages(initialMessages),
    id: imageUrl ? `chat-${imageUrl.slice(-10)}` : 'new-chat', // Force chat to reset when image changes
    onError: (error) => {
      console.error('=== CHAT useChat ERROR ===');
      console.error('Error object:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    },
    onFinish: (message) => {
      console.log('=== CHAT FINISHED ===');
      console.log('Final message:', message);
    }
  });

  const [hasPrefilledInput, setHasPrefilledInput] = useState(false);
  const [hasReportedFirstAnalysis, setHasReportedFirstAnalysis] = useState(false);

  // Reset chat when switching to different diagram
  useEffect(() => {
    setMessages(convertToAIMessages(initialMessages))
    setHasPrefilledInput(initialMessages.length > 0)
    setHasReportedFirstAnalysis(initialMessages.length > 0)
    setInput('')
    
    // Check for rating in initial messages
    if (initialMessages.length > 0) {
      const lastAssistantMessage = initialMessages
        .filter(msg => msg.role === 'assistant')
        .slice(-1)[0];
        
      if (lastAssistantMessage?.content) {
        const ratingMatch = lastAssistantMessage.content.match(/(?:\*\*)?Overall Rating:\s*(\d+)\/10(?:\*\*)?/i);
        if (ratingMatch) {
          const rating = parseInt(ratingMatch[1]);
          console.log('Extracted rating from initial messages:', rating);
          onRatingUpdate(rating);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageUrl])

  // Reset for new diagrams
  useEffect(() => {
    if (!imageUrl) {
      setHasPrefilledInput(false)
      setHasReportedFirstAnalysis(false)
    }
  }, [imageUrl])

  // Custom submit handler to include attachments and selected areas
  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    console.log('=== CHAT SUBMIT START ===');
    console.log('Input value:', input);
    console.log('ImageUrl provided:', !!imageUrl);
    console.log('ImageUrl length:', imageUrl ? imageUrl.length : 'null');
    console.log('Selected area provided:', !!selectedArea);
    console.log('Selected area length:', selectedArea ? selectedArea.length : 'null');

    // Prepare attachments if there's a selected area
    const attachments: Attachment[] = [];
    if (selectedArea && input.trim()) {
      console.log('Adding selected area as attachment');
      attachments.push({
        name: 'selected-area.png',
        contentType: 'image/png',
        url: selectedArea,
      });
    }

    // Clear the selected area immediately when sending
    if (onClearSelectedArea) {
      onClearSelectedArea();
    }

    const submitData = {
      body: {
        imageUrl: selectedArea || imageUrl,
      },
      experimental_attachments: attachments.length > 0 ? attachments : undefined,
    };

    console.log('Submit data:', {
      hasImageUrl: !!submitData.body.imageUrl,
      imageUrlLength: submitData.body.imageUrl ? submitData.body.imageUrl.length : 'null',
      attachmentsCount: attachments.length
    });

    // Call the original submit with current image data and attachments
    console.log('Calling handleSubmit...');
    handleSubmit(e, submitData);
  };

  useEffect(() => {
    if (imageUrl && !hasPrefilledInput && messages.length === 0 && initialMessages.length === 0) {
      setInput('Please analyze this architecture diagram and identify potential security threats using STRIDE methodology.');
      setHasPrefilledInput(true);
    }
  }, [imageUrl, hasPrefilledInput, messages.length, initialMessages.length, setInput]);

  useEffect(() => {
    if (!imageUrl) {
      setHasPrefilledInput(false);
      setInput('');
      setHasReportedFirstAnalysis(false);
    }
  }, [imageUrl, setInput]);

  // Extract rating from assistant messages
  useEffect(() => {
    const lastAssistantMessage = messages
      .filter(msg => msg.role === 'assistant')
      .slice(-1)[0];

    if (lastAssistantMessage?.content) {
      // More flexible regex to catch variations like "Overall Rating: 8/10" with or without asterisks
      const ratingMatch = lastAssistantMessage.content.match(/(?:\*\*)?Overall Rating:\s*(\d+)\/10(?:\*\*)?/i);
      if (ratingMatch) {
        const rating = parseInt(ratingMatch[1]);
        console.log('Extracted rating:', rating);
        onRatingUpdate(rating);
      }
    }
  }, [messages, onRatingUpdate, status]);

  // Report first analysis when it's complete
  useEffect(() => {
    console.log('First analysis check - Status:', status, 'Has reported:', hasReportedFirstAnalysis, 'Has callback:', !!onFirstAnalysis, 'Messages:', messages.length);

    // Check if we have an assistant message and streaming is complete
    const firstAssistantMessage = messages.find(msg => msg.role === 'assistant');

    if (!hasReportedFirstAnalysis && firstAssistantMessage?.content && status === 'ready' && onFirstAnalysis) {
      console.log('Reporting first analysis to parent, content length:', firstAssistantMessage.content.length);
      onFirstAnalysis(firstAssistantMessage.content);
      setHasReportedFirstAnalysis(true);
    }
  }, [messages, hasReportedFirstAnalysis, status, onFirstAnalysis]);

  // Update chat history when messages change
  useEffect(() => {
    if (onChatUpdate && messages.length > 0) {
      const chatMessages = convertToChatMessages(messages);
      onChatUpdate(chatMessages);
    }
  }, [messages, onChatUpdate]);

  return (
    <div className="flex flex-col h-full bg-zinc-50 dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800">
      <div className="bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 p-4 border-b border-zinc-200 dark:border-zinc-700">
        <h2 className="text-lg font-semibold">AI Architecture Analysis</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Powered by Gemini 2.5 Pro</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-zinc-500 dark:text-zinc-400 mt-8">
            <p>Ready to analyze your architecture diagram.</p>
            <p className="text-sm mt-2">Click send or modify the pre-filled message below.</p>
          </div>
        )}

        {messages.map((message) => {
          return (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 ${message.role === 'user'
                  ? 'bg-zinc-800 text-zinc-100 dark:bg-zinc-200 dark:text-zinc-900'
                  : 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'
                  }`}
              >
                {message.role === 'assistant' ? (
                  <div className="markdown-content">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({ children }) => <h1 className="text-lg font-bold mb-2 text-zinc-900 dark:text-zinc-100">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-base font-semibold mb-2 mt-4 text-zinc-900 dark:text-zinc-100">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-sm font-medium mb-1 mt-3 text-zinc-900 dark:text-zinc-100">{children}</h3>,
                        ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                        li: ({ children }) => <li className="text-sm">{children}</li>,
                        p: ({ children }) => <p className="mb-2 text-sm leading-relaxed">{children}</p>,
                        code: ({ children }) => <code className="bg-zinc-200 dark:bg-zinc-700 px-1 py-0.5 rounded text-xs">{children}</code>,
                        pre: ({ children }) => <pre className="bg-zinc-50 dark:bg-zinc-900 p-3 rounded-md text-xs overflow-x-auto mb-2">{children}</pre>,
                        strong: ({ children }) => <strong className="font-semibold text-zinc-900 dark:text-zinc-100">{children}</strong>,
                        table: ({ children }) => <table className="w-full border-collapse border border-zinc-300 dark:border-zinc-600 mb-2 text-xs">{children}</table>,
                        th: ({ children }) => <th className="border border-zinc-300 dark:border-zinc-600 p-2 bg-zinc-100 dark:bg-zinc-800 font-medium text-left">{children}</th>,
                        td: ({ children }) => <td className="border border-zinc-300 dark:border-zinc-600 p-2">{children}</td>,
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div>
                    {message.experimental_attachments?.filter(attachment =>
                      attachment.contentType?.startsWith('image/')
                    ).map((attachment, index) => (
                      <div key={`${message.id}-${index}`} className="mb-2 p-2 bg-zinc-700 dark:bg-zinc-300 rounded border">
                        <div className="text-xs text-zinc-300 dark:text-zinc-700 mb-1">Selected Component:</div>
                        <div className="relative w-16 h-16 bg-zinc-600 dark:bg-zinc-400 rounded">
                          <Image
                            src={attachment.url || ''}
                            alt={attachment.name || 'Selected component'}
                            fill
                            className="object-contain rounded"
                          />
                        </div>
                      </div>
                    ))}
                    <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {isLoading && (
        <div className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
          <AIThinkingLoader />
        </div>
      )}

      <form onSubmit={handleCustomSubmit} className="border-t border-zinc-200 dark:border-zinc-800 p-4">
        {selectedArea && (
          <div className="mb-3 p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Selected Area:</span>
              <button
                type="button"
                onClick={onClearSelectedArea}
                className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded transition-colors"
              >
                <X className="w-3 h-3 text-zinc-500" />
              </button>
            </div>
            <div className="relative w-16 h-16 bg-zinc-50 dark:bg-zinc-900 rounded border">
              <Image
                src={selectedArea}
                alt="Selected area"
                fill
                className="object-contain rounded"
              />
            </div>
          </div>
        )}

        <div className="flex space-x-3 items-end">
          <Textarea
            value={input}
            onChange={handleInputChange}
            placeholder={selectedArea ? "Ask about the selected component..." : "Ask about the architecture..."}
            className="flex-1 resize-none min-h-[80px] bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500"
            disabled={!imageUrl || isLoading}
            rows={3}
          />
          <button
            type="submit"
            disabled={!imageUrl || isLoading}
            className="bg-zinc-800 dark:bg-zinc-200 text-zinc-100 dark:text-zinc-900 p-2.5 rounded-lg hover:bg-zinc-700 dark:hover:bg-zinc-300 disabled:bg-zinc-300 dark:disabled:bg-zinc-700 disabled:cursor-not-allowed transition-colors shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}