# Modern Chat System Integration Guide

## Overview

This guide explains how to integrate the new modern chat system that fixes the focus issues you experienced with the previous modal-based chat implementation.

## Key Improvements

✅ **Fixed Focus Issues**: No more losing focus after each keystroke
✅ **Stable Input Elements**: Added stable `key` props to prevent re-mounting
✅ **Better Event Handling**: Proper event propagation management
✅ **Modern UI**: Clean, responsive design with animations
✅ **Multiple Chat Modes**: Full-featured and simple chat interfaces
✅ **Consistent API**: Unified hook-based state management

## Components

### 1. ModernChatSystem
Full-featured chat interface with conversation list, search, and advanced features.

### 2. SimpleChatInterface
Lightweight chat interface for simple one-on-one conversations.

### 3. ChatButton
Floating action button to open chat with unread count badge.

### 4. useChat Hook
Custom hook for managing chat state and API interactions.

## Quick Integration

### Step 1: Import Components
```tsx
import ModernChatSystem from '@/components/ui/ModernChatSystem';
import SimpleChatInterface from '@/components/ui/SimpleChatInterface';
import ChatButton from '@/components/ui/ChatButton';
import useChat from '@/hooks/useChat';
```

### Step 2: Initialize Chat Hook
```tsx
const chat = useChat({
  userId: currentUser.id,
  onSendMessage: async (conversationId, content, attachments) => {
    // Your API call here
    const response = await yourAPI.sendMessage(conversationId, content, attachments);
    return response;
  },
  onMarkAsRead: async (conversationId) => {
    await yourAPI.markAsRead(conversationId);
  },
  onSearch: async (query) => {
    const results = await yourAPI.searchConversations(query);
    return results;
  },
});
```

### Step 3: Add to Your Component
```tsx
return (
  <div>
    {/* Your existing content */}

    {/* Chat System */}
    <div className="fixed bottom-6 right-6 z-50">
      {!chat.isOpen && (
        <ChatButton
          onClick={chat.openChat}
          unreadCount={totalUnreadCount}
        />
      )}

      <ModernChatSystem
        conversations={chat.conversations}
        messages={chat.messages}
        currentUserId={userId}
        currentConversationId={chat.currentConversationId}
        onSendMessage={chat.sendMessage}
        onSelectConversation={chat.selectConversation}
        onSearch={chat.search}
        onMarkAsRead={chat.markAsRead}
        isLoading={chat.isLoading}
        isOpen={chat.isOpen}
        onClose={chat.closeChat}
        onToggleMinimize={chat.toggleMinimize}
        isMinimized={chat.isMinimized}
      />
    </div>
  </div>
);
```

## Role-Specific Integration

### Client Dashboard
```tsx
// Replace existing chat modal with:
<ChatIntegrationExample
  userId={currentUser.id}
  userRole="client"
  fetchConversations={() => clientAPI.getConversations()}
  sendMessageAPI={(id, content, files) => clientAPI.sendMessage(id, content, files)}
  markAsReadAPI={(id) => clientAPI.markAsRead(id)}
/>
```

### Worker Dashboard
```tsx
<ChatIntegrationExample
  userId={currentUser.id}
  userRole="worker"
  fetchConversations={() => workerAPI.getConversations()}
  sendMessageAPI={(id, content, files) => workerAPI.sendMessage(id, content, files)}
  markAsReadAPI={(id) => workerAPI.markAsRead(id)}
/>
```

### Admin Dashboards (HR/Outsource)
```tsx
<ChatIntegrationExample
  userId={currentUser.id}
  userRole="admin_hr" // or "admin_outsource"
  fetchConversations={() => adminAPI.getConversations()}
  sendMessageAPI={(id, content, files) => adminAPI.sendMessage(id, content, files)}
  markAsReadAPI={(id) => adminAPI.markAsRead(id)}
/>
```

## Migration from Old System

### 1. Remove Old Modal Usage
Replace instances of:
```tsx
// OLD - Remove these
<Modal isOpen={chatOpen} onClose={() => setChatOpen(false)}>
  {/* Old chat content */}
</Modal>
```

### 2. Replace with New Components
```tsx
// NEW - Use these instead
<ModernChatSystem
  isOpen={chat.isOpen}
  onClose={chat.closeChat}
  // ... other props
/>
```

### 3. Update State Management
```tsx
// OLD - Remove these
const [chatOpen, setChatOpen] = useState(false);
const [messages, setMessages] = useState([]);

// NEW - Use the hook instead
const chat = useChat({ userId, onSendMessage, onMarkAsRead });
```

## API Integration Examples

### Send Message API
```tsx
const sendMessage = async (conversationId: string, content: string, attachments?: File[]) => {
  try {
    const formData = new FormData();
    formData.append('conversationId', conversationId);
    formData.append('content', content);

    attachments?.forEach((file, index) => {
      formData.append(`attachment_${index}`, file);
    });

    const response = await fetch('/api/messages/send', {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    return await response.json();
  } catch (error) {
    console.error('Failed to send message:', error);
    throw error;
  }
};
```

### Fetch Conversations API
```tsx
const fetchConversations = async () => {
  try {
    const response = await fetch('/api/conversations', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch conversations:', error);
    return [];
  }
};
```

## Troubleshooting

### Focus Issues Still Occurring?
1. Ensure you're using the stable `key` props on input elements
2. Check that event handlers are not causing re-renders
3. Verify that the parent component isn't re-mounting the chat component

### Chat Not Opening?
1. Check that `isOpen` state is being managed correctly
2. Ensure the chat button `onClick` handler is calling the right function
3. Verify z-index is high enough (default: z-50)

### Messages Not Updating?
1. Check that your API calls are returning the expected data format
2. Ensure the `useChat` hook is receiving the correct callbacks
3. Verify that message IDs are unique

## Customization

### Styling
All components use Tailwind CSS classes and can be customized by:
1. Passing custom `className` props
2. Modifying the component files directly
3. Using CSS-in-JS for dynamic styles

### Animations
Components use CSS transitions and animations that can be customized in the component files.

### Icons
All icons are from Lucide React and can be replaced with your preferred icon library.

## Performance Considerations

1. **Virtual Scrolling**: For large message lists, consider implementing virtual scrolling
2. **Message Pagination**: Load messages in chunks for better performance
3. **Debounced Search**: Search functionality includes debouncing to reduce API calls
4. **Connection Management**: Consider implementing WebSocket connections for real-time updates

## Support

If you encounter any issues with the new chat system, check:
1. Browser console for JavaScript errors
2. Network tab for failed API requests
3. React DevTools for component state issues

The new system is designed to be robust and user-friendly, eliminating the focus issues you experienced with the previous implementation.
