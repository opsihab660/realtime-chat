import { XMarkIcon } from '@heroicons/react/24/outline';
import { isEmojiOnly, countEmojis } from '../utils/emojiUtils';

const ReplyPreview = ({ replyingTo, onCancel, currentUser, conversationParticipant, className = '' }) => {
  if (!replyingTo) return null;

  // Check if the reply message is emoji-only
  const isEmojiOnlyMessage = isEmojiOnly(replyingTo.content);
  const emojiCount = countEmojis(replyingTo.content);

  // Helper function to get sender name
  const getSenderName = () => {
    if (!replyingTo) return 'Unknown User';

    // Check different possible structures
    if (replyingTo.sender?.username) {
      return replyingTo.sender.username;
    }

    // If sender is just an ID, try to find from current conversation participants
    if (typeof replyingTo.sender === 'string' || replyingTo.sender?._id) {
      const senderId = typeof replyingTo.sender === 'string'
        ? replyingTo.sender
        : replyingTo.sender._id;

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

  return (
    <div className={`bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-3 sm:px-4 py-2 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <div className="w-1 h-8 bg-blue-500 rounded-full"></div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                Replying to {getSenderName()}
              </p>
              {isEmojiOnlyMessage ? (
                <div className="flex items-center space-x-2">
                  <span className={`font-emoji ${emojiCount === 1 ? 'text-lg' : emojiCount <= 3 ? 'text-base' : 'text-sm'}`}>
                    {replyingTo.content}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {emojiCount === 1 ? 'Emoji' : `${emojiCount} Emojis`}
                  </span>
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {replyingTo.content || 'Message not available'}
                </p>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={onCancel}
          className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ml-2"
          title="Cancel reply"
        >
          <XMarkIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        </button>
      </div>
    </div>
  );
};

export default ReplyPreview;
