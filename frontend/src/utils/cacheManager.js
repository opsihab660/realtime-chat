// 🚀 ULTRA-FAST CACHE MANAGER - Advanced caching for smooth experience
class CacheManager {
  constructor() {
    this.memoryCache = new Map();
    this.persistentCache = this.initPersistentCache();
    this.maxMemorySize = 100; // Max conversations in memory
    this.maxPersistentSize = 500; // Max conversations in localStorage
    this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours
  }

  // Initialize persistent cache from localStorage
  initPersistentCache() {
    try {
      const cached = localStorage.getItem('chatCache');
      return cached ? JSON.parse(cached) : {};
    } catch (error) {
      console.error('Failed to load persistent cache:', error);
      return {};
    }
  }

  // Save to persistent cache
  savePersistentCache() {
    try {
      // Clean expired entries before saving
      this.cleanExpiredEntries();
      localStorage.setItem('chatCache', JSON.stringify(this.persistentCache));
    } catch (error) {
      console.error('Failed to save persistent cache:', error);
    }
  }

  // Clean expired entries
  cleanExpiredEntries() {
    const now = Date.now();
    Object.keys(this.persistentCache).forEach(key => {
      const entry = this.persistentCache[key];
      if (entry.timestamp && (now - entry.timestamp) > this.cacheExpiry) {
        delete this.persistentCache[key];
      }
    });
  }

  // Get messages from cache
  getMessages(conversationId) {
    // First check memory cache
    if (this.memoryCache.has(conversationId)) {
      return this.memoryCache.get(conversationId);
    }

    // Then check persistent cache
    const persistentKey = `messages_${conversationId}`;
    if (this.persistentCache[persistentKey]) {
      const entry = this.persistentCache[persistentKey];
      const now = Date.now();
      
      // Check if not expired
      if ((now - entry.timestamp) < this.cacheExpiry) {
        // Move to memory cache for faster access
        this.memoryCache.set(conversationId, entry.data);
        return entry.data;
      } else {
        // Remove expired entry
        delete this.persistentCache[persistentKey];
      }
    }

    return null;
  }

  // Set messages in cache
  setMessages(conversationId, messages) {
    // Add to memory cache
    this.memoryCache.set(conversationId, messages);

    // Add to persistent cache
    const persistentKey = `messages_${conversationId}`;
    this.persistentCache[persistentKey] = {
      data: messages,
      timestamp: Date.now()
    };

    // Manage memory cache size
    if (this.memoryCache.size > this.maxMemorySize) {
      const firstKey = this.memoryCache.keys().next().value;
      this.memoryCache.delete(firstKey);
    }

    // Manage persistent cache size
    const persistentKeys = Object.keys(this.persistentCache).filter(k => k.startsWith('messages_'));
    if (persistentKeys.length > this.maxPersistentSize) {
      // Remove oldest entries
      persistentKeys
        .sort((a, b) => this.persistentCache[a].timestamp - this.persistentCache[b].timestamp)
        .slice(0, persistentKeys.length - this.maxPersistentSize)
        .forEach(key => delete this.persistentCache[key]);
    }

    // Save to localStorage
    this.savePersistentCache();
  }

  // Add new message to existing cache
  addMessage(conversationId, message) {
    const cached = this.getMessages(conversationId);
    if (cached) {
      const updated = [message, ...cached];
      this.setMessages(conversationId, updated);
      return updated;
    }
    return null;
  }

  // Update message in cache
  updateMessage(conversationId, messageId, updates) {
    const cached = this.getMessages(conversationId);
    if (cached) {
      const updated = cached.map(msg => 
        msg._id === messageId ? { ...msg, ...updates } : msg
      );
      this.setMessages(conversationId, updated);
      return updated;
    }
    return null;
  }

  // Remove message from cache
  removeMessage(conversationId, messageId) {
    const cached = this.getMessages(conversationId);
    if (cached) {
      const updated = cached.filter(msg => msg._id !== messageId);
      this.setMessages(conversationId, updated);
      return updated;
    }
    return null;
  }

  // Cache conversations list
  setConversations(conversations) {
    this.memoryCache.set('conversations', conversations);
    this.persistentCache['conversations'] = {
      data: conversations,
      timestamp: Date.now()
    };
    this.savePersistentCache();
  }

  // Get conversations from cache
  getConversations() {
    // Check memory first
    if (this.memoryCache.has('conversations')) {
      return this.memoryCache.get('conversations');
    }

    // Check persistent cache
    if (this.persistentCache['conversations']) {
      const entry = this.persistentCache['conversations'];
      const now = Date.now();
      
      if ((now - entry.timestamp) < this.cacheExpiry) {
        this.memoryCache.set('conversations', entry.data);
        return entry.data;
      } else {
        delete this.persistentCache['conversations'];
      }
    }

    return null;
  }

  // Cache user data
  setUsers(users) {
    this.memoryCache.set('users', users);
    this.persistentCache['users'] = {
      data: users,
      timestamp: Date.now()
    };
    this.savePersistentCache();
  }

  // Get users from cache
  getUsers() {
    if (this.memoryCache.has('users')) {
      return this.memoryCache.get('users');
    }

    if (this.persistentCache['users']) {
      const entry = this.persistentCache['users'];
      const now = Date.now();
      
      if ((now - entry.timestamp) < this.cacheExpiry) {
        this.memoryCache.set('users', entry.data);
        return entry.data;
      } else {
        delete this.persistentCache['users'];
      }
    }

    return null;
  }

  // Clear specific cache
  clearCache(key) {
    this.memoryCache.delete(key);
    if (key.startsWith('messages_')) {
      delete this.persistentCache[key];
    } else {
      delete this.persistentCache[key];
    }
    this.savePersistentCache();
  }

  // Clear all cache
  clearAllCache() {
    this.memoryCache.clear();
    this.persistentCache = {};
    localStorage.removeItem('chatCache');
  }

  // Get cache stats
  getCacheStats() {
    return {
      memorySize: this.memoryCache.size,
      persistentSize: Object.keys(this.persistentCache).length,
      memoryKeys: Array.from(this.memoryCache.keys()),
      persistentKeys: Object.keys(this.persistentCache)
    };
  }
}

// Create singleton instance
export const cacheManager = new CacheManager();

// Export for debugging
window.cacheManager = cacheManager;
