import React, { useState, useRef, useEffect } from 'react';
import { ArrowUturnLeftIcon, EllipsisVerticalIcon, TrashIcon, PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { isEmojiOnly, countEmojis, getEmojiSizeClass, isSingleEmoji } from '../utils/emojiUtils';
import DeleteMessageModal from './DeleteMessageModal';

const Message = ({
  message,
  isOwn,
  currentUser,
  conversationParticipant,
  onReply,
  onDelete,
  onEdit,
  className = ''
}) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content || '');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const editTextareaRef = useRef(null);

  // Focus textarea when editing starts
  useEffect(() => {
    if (isEditing && editTextareaRef.current) {
      editTextareaRef.current.focus();
      // Set cursor to end of text
      const length = editTextareaRef.current.value.length;
      editTextareaRef.current.setSelectionRange(length, length);
    }
  }, [isEditing]);

  const handleReply = () => {
    if (onReply) {
      onReply(message);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditContent(message.content || '');
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(message.content || '');
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim() || editContent.trim() === message.content) {
      handleCancelEdit();
      return;
    }

    if (onEdit) {
      setIsSubmittingEdit(true);
      try {
        await onEdit(message, editContent.trim());
        setIsEditing(false);
      } catch (error) {
        console.error('Edit error:', error);
      } finally {
        setIsSubmittingEdit(false);
      }
    }
  };

  const handleEditKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (onDelete) {
      setIsDeleting(true);
      try {
        await onDelete(message);
        setShowDeleteModal(false);
      } catch (error) {
        console.error('Delete error:', error);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
  };

  // Check if message is emoji-only
  const isEmojiOnlyMessage = isEmojiOnly(message.content);
  const emojiCount = countEmojis(message.content);
  const isSingleEmojiMessage = isSingleEmoji(message.content);

  // Check if reply-to message is emoji-only
  const isReplyToEmojiOnly = message.replyTo ? isEmojiOnly(message.replyTo.content) : false;
  const replyToEmojiCount = message.replyTo ? countEmojis(message.replyTo.content) : 0;



  // Helper function to get reply sender name
  const getReplyToSenderName = () => {
    if (!message.replyTo) return 'Unknown User';

    // Check different possible structures
    if (message.replyTo.sender?.username) {
      return message.replyTo.sender.username;
    }

    // If sender is just an ID, try to find from current conversation participants
    if (typeof message.replyTo.sender === 'string' || message.replyTo.sender?._id) {
      const senderId = typeof message.replyTo.sender === 'string'
        ? message.replyTo.sender
        : message.replyTo.sender._id;

      // If it's the current user
      if (senderId === currentUser?._id) {
        return 'You';
      }

      // If it's the conversation participant
      if (senderId === conversationParticipant?._id) {
        return conversationParticipant.username;
      }

      // Otherwise return a fallback
      return 'User';
    }

    return 'Unknown User';
  };

  // Check if message is deleted
  const isDeleted = message.deleted?.isDeleted;

  // Check if message can be edited
  const canEdit = () => {
    if (!isOwn || isDeleted || message.type !== 'text') return false;

    // Check edit time limit (15 minutes)
    const editTimeLimit = 15 * 60 * 1000; // 15 minutes in milliseconds
    const timeSinceCreation = Date.now() - new Date(message.createdAt).getTime();

    return timeSinceCreation <= editTimeLimit;
  };

  const isEditable = canEdit();

  return (
    <>
      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group ${className}`}>
        <div className="max-w-[85%] sm:max-w-xs lg:max-w-md">
        {/* Reply to message preview */}
        {message.replyTo && (
          <div className={`mb-2 ${isOwn ? 'ml-auto' : 'mr-auto'} max-w-full`}>
            <div className={`
              px-3 py-2 rounded-lg border-l-4 text-xs
              ${isOwn
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-400 text-blue-800 dark:text-blue-200'
                : 'bg-gray-50 dark:bg-gray-800 border-gray-400 text-gray-600 dark:text-gray-300'
              }
            `}>
              <p className="font-medium text-xs mb-1">
                {getReplyToSenderName()}
              </p>
              {isReplyToEmojiOnly ? (
                <div className="flex items-center space-x-2">
                  <span className={`${replyToEmojiCount === 1 ? 'text-base' : replyToEmojiCount <= 3 ? 'text-sm' : 'text-xs'} opacity-75`}>
                    {message.replyTo.content}
                  </span>
                  <span className="text-xs opacity-50">
                    {replyToEmojiCount === 1 ? 'Emoji' : `${replyToEmojiCount} Emojis`}
                  </span>
                </div>
              ) : (
                <p className="truncate opacity-75">
                  {message.replyTo.content || 'Message not available'}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Main message */}
        <div className="relative">
          <div
            className={`
              ${isEmojiOnlyMessage
                ? `
                  ${isSingleEmojiMessage
                    ? 'p-2 bg-transparent'
                    : 'px-3 py-2 bg-transparent'
                  }
                  rounded-2xl relative
                `
                : `
                  px-3 sm:px-4 py-2 rounded-lg relative
                  ${isOwn
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600'
                  }
                `
              }
            `}
          >
            {isDeleted ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                Message deleted
              </p>
            ) : isEditing ? (
              <div className="space-y-2">
                <textarea
                  ref={editTextareaRef}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  onKeyDown={handleEditKeyDown}
                  className={`
                    w-full text-sm bg-transparent border-none outline-none resize-none
                    ${isOwn ? 'text-white placeholder-blue-200' : 'text-gray-900 dark:text-white placeholder-gray-400'}
                  `}
                  placeholder="Edit message..."
                  rows={Math.max(1, Math.ceil(editContent.length / 50))}
                  disabled={isSubmittingEdit}
                />
                <div className="flex items-center justify-end space-x-2">
                  <button
                    onClick={handleCancelEdit}
                    disabled={isSubmittingEdit}
                    className={`
                      p-1 rounded-full transition-colors
                      ${isOwn
                        ? 'text-blue-200 hover:text-white hover:bg-blue-500'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600'
                      }
                    `}
                    title="Cancel edit"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={isSubmittingEdit || !editContent.trim() || editContent.trim() === message.content}
                    className={`
                      p-1 rounded-full transition-colors
                      ${isOwn
                        ? 'text-blue-200 hover:text-white hover:bg-blue-500 disabled:text-blue-300 disabled:cursor-not-allowed'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed'
                      }
                    `}
                    title="Save edit"
                  >
                    <CheckIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className={`
                  ${isEmojiOnlyMessage
                    ? `${getEmojiSizeClass(emojiCount)} leading-none text-center emoji-message font-emoji ${isSingleEmojiMessage ? 'single-emoji' : ''}`
                    : 'text-sm break-words whitespace-pre-wrap'
                  }
                `}>
                  {message.content}
                </p>
                {message.edited?.isEdited && (
                  <p className={`text-xs mt-1 italic ${
                    isOwn ? 'text-blue-200' : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    edited
                  </p>
                )}
              </div>
            )}

            {/* Message footer - hide for emoji-only messages */}
            {!isEmojiOnlyMessage && (
              <div className={`flex items-center justify-between mt-1 ${
                isOwn ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
              }`}>
                <p className="text-xs">
                  {new Date(message.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>

                {/* Seen indicator for sent messages */}
                {isOwn && (
                  <div className="flex items-center space-x-1 ml-2">
                    {message.readBy && message.readBy.length > 0 ? (
                      <div className="flex items-center space-x-1">
                        <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-xs text-blue-400">Seen</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1">
                        <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-xs text-gray-400">Sent</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Timestamp for emoji-only messages - show on hover */}
          {isEmojiOnlyMessage && (
            <div className={`
              absolute ${isOwn ? '-left-20' : '-right-20'} top-1/2 transform -translate-y-1/2
              opacity-0 group-hover:opacity-100 transition-opacity duration-200
              text-xs text-white bg-black/75 px-2 py-1 rounded whitespace-nowrap
              pointer-events-none z-10
            `}>
              {new Date(message.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          )}

          {/* Message actions (visible on hover) - hide for deleted messages */}
          {!isDeleted && (
            <div className={`
              absolute top-0 ${isOwn ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'}
              opacity-0 group-hover:opacity-100 transition-opacity duration-200
              flex items-center space-x-1 px-2
            `}>
              <button
                onClick={handleReply}
                className="p-1.5 rounded-full bg-white dark:bg-gray-700 shadow-md border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                title="Reply"
              >
                <ArrowUturnLeftIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </button>

              {/* Edit button - only show for own editable messages */}
              {isEditable && (
                <button
                  onClick={handleEdit}
                  className="p-1.5 rounded-full bg-white dark:bg-gray-700 shadow-md border border-gray-200 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                  title="Edit message"
                >
                  <PencilIcon className="w-4 h-4 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400" />
                </button>
              )}

              {/* Delete button - only show for own messages */}
              {isOwn && (
                <button
                  onClick={handleDelete}
                  className="p-1.5 rounded-full bg-white dark:bg-gray-700 shadow-md border border-gray-200 dark:border-gray-600 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-700 transition-colors"
                  title="Delete message"
                >
                  <TrashIcon className="w-4 h-4 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400" />
                </button>
              )}

              <button
                className="p-1.5 rounded-full bg-white dark:bg-gray-700 shadow-md border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                title="More options"
              >
                <EllipsisVerticalIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Delete confirmation modal */}
    <DeleteMessageModal
      isOpen={showDeleteModal}
      onClose={handleCancelDelete}
      onConfirm={handleConfirmDelete}
      message={message}
      isDeleting={isDeleting}
    />
  </>
  );
};

export default Message;
