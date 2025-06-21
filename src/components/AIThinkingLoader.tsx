import React, { useState, useEffect } from 'react';

const thinkingMessages = [
  "initializing neural networks...",
  "analyzing architectural patterns...",
  "computing threat vectors...",
  "processing security matrices...",
  "evaluating STRIDE components...",
  "cross-referencing vulnerabilities...",
  "synthesizing recommendations...",
  "optimizing response parameters...",
  "connecting the dots...",
  "running deep analysis...",
  "training models on-the-fly...",
  "parsing diagram semantics...",
  "executing threat modeling...",
  "calibrating security algorithms...",
  "generating insights...",
  "dreaming in binary...",
  "asking ChatGPT for advice...",
  "updating sentience firmware...",
  "translating thoughts to code...",
  "running on coffee and algorithms...",
  "hacking the mainframe (just kidding)...",
];

export function AIThinkingLoader() {
  const [currentMessage, setCurrentMessage] = useState(thinkingMessages[0]);
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % thinkingMessages.length);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setCurrentMessage(thinkingMessages[messageIndex]);
  }, [messageIndex]);

  return (
    <div className="flex items-center space-x-2 px-3 py-2">
      <div className="flex space-x-1">
        <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
      <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
        {currentMessage}
      </span>
    </div>
  );
}