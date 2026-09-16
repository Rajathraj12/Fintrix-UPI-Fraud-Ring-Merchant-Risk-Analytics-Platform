import React from 'react';
import FintrixAIChat from '../components/chat/FintrixAIChat';

/**
 * Dedicated Full-Page View for Fintrix AI Conversational Financial Intelligence Console.
 */
export default function FintrixAIChatPage({ onNavigate }) {
  return (
    <div className="page-anim chat-container-mobile" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <FintrixAIChat onNavigate={onNavigate} />
    </div>
  );
}
