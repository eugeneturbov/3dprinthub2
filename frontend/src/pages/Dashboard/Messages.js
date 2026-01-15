import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { messagesAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { 
  EnvelopeIcon,
  PaperAirplaneIcon,
  UserIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { Spinner } from '../components/UI/Spinner';
import toast from 'react-hot-toast';

const Messages = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messageContent, setMessageContent] = useState('');
  const [isSending, setIsSending] = useState(false);

  const { data: conversations, isLoading: conversationsLoading } = useQuery(
    'conversations',
    messagesAPI.getConversations,
    {
      refetchInterval: 30000 // Refetch every 30 seconds
    }
  );

  const { data: messages, isLoading: messagesLoading } = useQuery(
    ['messages', selectedConversation],
    () => messagesAPI.getConversation(selectedConversation),
    {
      enabled: !!selectedConversation,
      refetchInterval: 10000 // Refetch every 10 seconds for active conversation
    }
  );

  const { data: unreadCount } = useQuery(
    'unreadCount',
    messagesAPI.getUnreadCount,
    {
      refetchInterval: 30000
    }
  );

  const sendMessageMutation = useMutation(
    messagesAPI.sendMessage,
    {
      onSuccess: () => {
        setMessageContent('');
        queryClient.invalidateQueries('conversations');
        queryClient.invalidateQueries(['messages', selectedConversation]);
        queryClient.invalidateQueries('unreadCount');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Ошибка отправки сообщения');
      }
    }
  );

  const markAsReadMutation = useMutation(
    messagesAPI.markAsRead,
    {
      onSuccess: () => {
        queryClient.invalidateQueries('unreadCount');
      }
    }
  );

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!messageContent.trim() || !selectedConversation) return;

    setIsSending(true);
    try {
      await sendMessageMutation.mutateAsync({
        recipient_id: selectedConversation,
        subject: 'Сообщение',
        content: messageContent.trim()
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleSelectConversation = (userId) => {
    setSelectedConversation(userId);
    // Mark messages as read when opening conversation
    const unreadMessages = messages?.messages?.filter(m => 
      m.recipient_id === user.id && !m.is_read
    );
    
    if (unreadMessages?.length > 0) {
      unreadMessages.forEach(message => {
        markAsReadMutation.mutate(message.id);
      });
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      return diffInMinutes < 1 ? 'Только что' : `${diffInMinutes} мин назад`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} ч назад`;
    } else if (diffInHours < 48) {
      return 'Вчера';
    } else {
      return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short'
      });
    }
  };

  const getOtherUser = (conversation) => {
    return conversation.sender_id === user.id 
      ? conversation.recipient 
      : conversation.sender;
  };

  if (conversationsLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="flex h-[600px]">
          {/* Conversations List */}
          <div className="w-80 border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h1 className="text-lg font-semibold text-gray-900">Сообщения</h1>
              {unreadCount?.unread_count > 0 && (
                <span className="badge badge-primary mt-1">
                  {unreadCount.unread_count} непрочитанных
                </span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto">
              {conversations?.conversations?.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {conversations.conversations.map((conversation) => {
                    const otherUser = getOtherUser(conversation);
                    const isSelected = selectedConversation === otherUser.id;
                    const isUnread = conversation.unread_count > 0 && conversation.recipient_id === user.id;

                    return (
                      <button
                        key={conversation.id}
                        onClick={() => handleSelectConversation(otherUser.id)}
                        className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                          isSelected ? 'bg-primary-50 border-l-4 border-primary-500' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            {otherUser?.avatar_url ? (
                              <img
                                src={otherUser.avatar_url}
                                alt={otherUser.first_name}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                <UserIcon className="h-5 w-5 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className={`text-sm font-medium text-gray-900 truncate ${
                                isUnread ? 'font-semibold' : ''
                              }`}>
                                {otherUser?.first_name} {otherUser?.last_name}
                              </p>
                              <span className="text-xs text-gray-500">
                                {formatTime(conversation.created_at)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 truncate">
                              {conversation.subject}
                            </p>
                            <p className={`text-xs text-gray-500 truncate ${
                              isUnread ? 'font-medium text-gray-900' : ''
                            }`}>
                              {conversation.content}
                            </p>
                          </div>
                        </div>
                        {isUnread && (
                          <div className="w-2 h-2 bg-primary-500 rounded-full mt-2"></div>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <EnvelopeIcon className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Нет сообщений
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Начните общение с продавцами или покупателями
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 flex flex-col">
            {selectedConversation ? (
              <>
                {/* Header */}
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    {conversations?.conversations?.find(c => {
                      const otherUser = getOtherUser(c);
                      return otherUser.id === selectedConversation;
                    }) && (() => {
                      const otherUser = getOtherUser(
                        conversations.conversations.find(c => {
                          const otherUser = getOtherUser(c);
                          return otherUser.id === selectedConversation;
                        })
                      );
                      return (
                        <>
                          {otherUser?.avatar_url ? (
                            <img
                              src={otherUser.avatar_url}
                              alt={otherUser.first_name}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                              <UserIcon className="h-4 w-4 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900">
                              {otherUser?.first_name} {otherUser?.last_name}
                            </p>
                            <p className="text-xs text-gray-500">В сети</p>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4">
                  {messagesLoading ? (
                    <div className="flex justify-center py-8">
                      <Spinner />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages?.messages?.map((message) => {
                        const isOwn = message.sender_id === user.id;
                        return (
                          <div
                            key={message.id}
                            className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              isOwn
                                ? 'bg-primary-600 text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}>
                              <p className="text-sm">{message.content}</p>
                              <div className={`flex items-center gap-1 mt-1 text-xs ${
                                isOwn ? 'text-primary-200' : 'text-gray-500'
                              }`}>
                                <ClockIcon className="h-3 w-3" />
                                {formatTime(message.created_at)}
                                {isOwn && message.is_read && (
                                  <CheckCircleIcon className="h-3 w-3" />
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-200">
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input
                      type="text"
                      value={messageContent}
                      onChange={(e) => setMessageContent(e.target.value)}
                      placeholder="Введите сообщение..."
                      className="flex-1 form-input"
                      disabled={isSending}
                    />
                    <button
                      type="submit"
                      disabled={!messageContent.trim() || isSending}
                      className="btn btn-primary"
                    >
                      {isSending ? (
                        <Spinner size="sm" />
                      ) : (
                        <PaperAirplaneIcon className="h-4 w-4" />
                      )}
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <EnvelopeIcon className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Выберите переписку
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Выберите собеседника слева, чтобы начать общение
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;
