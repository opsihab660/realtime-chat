import { useState, useRef, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';

const CustomEmojiPicker = ({ onEmojiClick, isVisible, onClose }) => {
  const { theme } = useTheme();
  const [activeCategory, setActiveCategory] = useState('smileys');
  const [searchTerm, setSearchTerm] = useState('');
  const pickerRef = useRef(null);

  // Emoji categories with custom organization
  const emojiCategories = {
    smileys: {
      name: 'Smileys & People',
      icon: '😊',
      emojis: [
        '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
        '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙',
        '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔',
        '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥',
        '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧',
        '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐'
      ]
    },
    hearts: {
      name: 'Hearts & Love',
      icon: '❤️',
      emojis: [
        '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
        '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '♥️',
        '💋', '💌', '💐', '🌹', '🌷', '🌺', '🌸', '🌼', '🌻', '💒'
      ]
    },
    gestures: {
      name: 'Hand Gestures',
      icon: '👋',
      emojis: [
        '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤏', '✌️', '🤞', '🤟',
        '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎',
        '👊', '✊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏'
      ]
    },
    activities: {
      name: 'Activities',
      icon: '⚽',
      emojis: [
        '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱',
        '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳',
        '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛷', '⛸️'
      ]
    },
    food: {
      name: 'Food & Drink',
      icon: '🍕',
      emojis: [
        '🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒',
        '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬',
        '🥒', '🌶️', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔', '🍠',
        '🥐', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈', '🥞', '🧇',
        '🥓', '🥩', '🍗', '🍖', '🌭', '🍔', '🍟', '🍕', '🥪', '🥙'
      ]
    },
    nature: {
      name: 'Nature',
      icon: '🌿',
      emojis: [
        '🌱', '🌿', '☘️', '🍀', '🎋', '🎍', '🌾', '🌵', '🌲', '🌳',
        '🌴', '🌸', '🌺', '🌻', '🌷', '🌹', '🥀', '🌼', '💐', '🍄',
        '🌰', '🎃', '🐚', '🌊', '💧', '❄️', '☃️', '⛄', '🔥', '💥'
      ]
    },
    symbols: {
      name: 'Symbols',
      icon: '⭐',
      emojis: [
        '⭐', '🌟', '✨', '💫', '🌠', '🔥', '💥', '💢', '💨', '💦',
        '💤', '🕳️', '💣', '💡', '🔔', '🔕', '🎵', '🎶', '💯', '💢',
        '💬', '💭', '🗯️', '💤', '🔥', '💥', '💫', '💨', '🕳️', '💣'
      ]
    },
    flags: {
      name: 'Flags',
      icon: '🏁',
      emojis: [
        '🏁', '🚩', '🎌', '🏴', '🏳️', '🏳️‍🌈', '🏳️‍⚧️', '🏴‍☠️', '🇦🇫', '🇦🇱',
        '🇩🇿', '🇦🇸', '🇦🇩', '🇦🇴', '🇦🇮', '🇦🇶', '🇦🇬', '🇦🇷', '🇦🇲', '🇦🇼',
        '🇦🇺', '🇦🇹', '🇦🇿', '🇧🇸', '🇧🇭', '🇧🇩', '🇧🇧', '🇧🇾', '🇧🇪', '🇧🇿'
      ]
    }
  };

  // Filter emojis based on search term
  const getFilteredEmojis = () => {
    if (!searchTerm) return emojiCategories[activeCategory].emojis;

    const allEmojis = Object.values(emojiCategories).flatMap(cat => cat.emojis);
    return allEmojis.filter(emoji => {
      // Simple search - you can enhance this with emoji names/keywords
      return emoji.includes(searchTerm);
    });
  };

  // Handle emoji selection
  const handleEmojiSelect = (emoji) => {
    onEmojiClick({ emoji });
  };

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div
      ref={pickerRef}
      className={`
        emoji-picker w-80 h-[500px] rounded-2xl shadow-2xl border-2 overflow-hidden backdrop-blur-sm
        ${theme === 'dark'
          ? 'bg-gray-800/95 border-gray-600 shadow-black/50'
          : 'bg-white/95 border-gray-200 shadow-gray-500/20'
        }
        animate-in slide-in-from-bottom-2 duration-200 flex flex-col
      `}
    >
      {/* Compact Header */}
      <div className={`
        px-4 py-3 border-b flex items-center justify-between flex-shrink-0
        ${theme === 'dark' ? 'border-gray-700 bg-gradient-to-r from-gray-800 to-gray-750' : 'border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50'}
      `}>
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm">😊</span>
          </div>
          <h3 className={`
            font-bold text-base
            ${theme === 'dark' ? 'text-white' : 'text-gray-800'}
          `}>
            Choose Emoji
          </h3>
        </div>
        <button
          onClick={onClose}
          className={`
            p-1.5 rounded-lg transition-all duration-200 hover:scale-105
            ${theme === 'dark'
              ? 'hover:bg-gray-700 text-gray-400 hover:text-white'
              : 'hover:bg-gray-200 text-gray-500 hover:text-gray-700'
            }
          `}
          title="Close"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Compact Search Bar */}
      <div className="px-3 py-2 flex-shrink-0">
        <input
          type="text"
          placeholder="Search emojis..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`
            w-full px-3 py-1.5 rounded-lg border text-sm
            ${theme === 'dark'
              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500'
              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
            }
            focus:outline-none focus:ring-1 focus:ring-blue-500 focus:ring-opacity-50
          `}
        />
      </div>

      {/* Compact Category Tabs */}
      {!searchTerm && (
        <div className={`
          px-2 py-2 border-b flex-shrink-0
          ${theme === 'dark'
            ? 'bg-gray-800 border-gray-700'
            : 'bg-white border-gray-200'
          }
        `}>
          <div className="grid grid-cols-8 gap-1">
            {Object.entries(emojiCategories).map(([key, category]) => (
              <button
                key={key}
                onClick={() => setActiveCategory(key)}
                className={`
                  category-button flex items-center justify-center p-2 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105
                  ${activeCategory === key
                    ? theme === 'dark'
                      ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-md ring-1 ring-blue-400/50'
                      : 'bg-gradient-to-br from-blue-500 to-purple-500 text-white shadow-md ring-1 ring-blue-400/50'
                    : theme === 'dark'
                      ? 'text-gray-400 hover:text-white hover:bg-gray-700 bg-gray-750/50'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100 bg-gray-50'
                  }
                  h-10 w-full relative overflow-hidden
                `}
                title={category.name}
              >
                <span className="text-base">{category.icon}</span>
                {activeCategory === key && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/50"></div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Enhanced Emoji Grid */}
      <div className="flex-1 overflow-y-auto p-3 emoji-picker-scroll">
        <div className="grid grid-cols-8 gap-2 max-w-full">
          {getFilteredEmojis().map((emoji, index) => (
            <button
              key={`${emoji}-${index}`}
              onClick={() => handleEmojiSelect(emoji)}
              className={`
                aspect-square w-full h-10 text-2xl rounded-lg transition-all duration-200
                hover:scale-110 active:scale-95 relative overflow-hidden
                ${theme === 'dark'
                  ? 'hover:bg-gray-700 hover:shadow-lg'
                  : 'hover:bg-gray-100 hover:shadow-lg'
                }
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
                flex items-center justify-center group
              `}
              title={emoji}
            >
              <span className="group-hover:animate-bounce leading-none">{emoji}</span>
              <div className={`
                absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200
                ${theme === 'dark'
                  ? 'bg-gradient-to-br from-blue-500/20 to-purple-500/20'
                  : 'bg-gradient-to-br from-blue-200/30 to-purple-200/30'
                }
              `}></div>
            </button>
          ))}
        </div>

        {getFilteredEmojis().length === 0 && searchTerm && (
          <div className={`
            text-center py-8
            ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}
          `}>
            <div className="text-4xl mb-2">🔍</div>
            <p>No emojis found for "{searchTerm}"</p>
          </div>
        )}
      </div>

      {/* Compact Footer */}
      <div className={`
        px-3 py-2 text-xs border-t flex items-center justify-center flex-shrink-0
        ${theme === 'dark'
          ? 'border-gray-700 bg-gradient-to-r from-gray-800 to-gray-750'
          : 'border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50'
        }
      `}>
        <div className="flex items-center space-x-2">
          <span className={`
            ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}
          `}>
            Click emoji to add
          </span>
          <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
          <span className={`
            text-xs font-medium
            ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}
          `}>
            Chat App
          </span>
        </div>
      </div>
    </div>
  );
};

export default CustomEmojiPicker;
