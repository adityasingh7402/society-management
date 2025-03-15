// pages/discussion-forums.js
import React, { useState, useEffect, useRef } from 'react';

export default function DiscussionForums() {
  // State for all forum categories
  const [categories, setCategories] = useState([
    {
      id: 1,
      name: "General Discussion",
      description: "General topics related to our community",
      threads: 24,
      posts: 156,
      lastActivity: "2025-03-14T10:30:00"
    },
    {
      id: 2,
      name: "Announcements",
      description: "Official announcements from the management",
      threads: 12,
      posts: 45,
      lastActivity: "2025-03-13T15:20:00"
    },
    {
      id: 3,
      name: "Maintenance Requests",
      description: "Discuss maintenance issues and requests",
      threads: 36,
      posts: 210,
      lastActivity: "2025-03-15T08:45:00"
    },
    {
      id: 4,
      name: "Events & Activities",
      description: "Community events and activities",
      threads: 18,
      posts: 98,
      lastActivity: "2025-03-12T18:15:00"
    },
    {
      id: 5,
      name: "Buy & Sell",
      description: "Marketplace for community members",
      threads: 42,
      posts: 186,
      lastActivity: "2025-03-14T14:25:00"
    }
  ]);

  // State for active category and thread
  const [activeCategory, setActiveCategory] = useState(null);
  const [activeThread, setActiveThread] = useState(null);
  const [newMessageText, setNewMessageText] = useState('');
  const messagesEndRef = useRef(null);

  // Sample user data
  const currentUser = {
    id: 'user123',
    name: 'John Doe',
    avatar: 'https://via.placeholder.com/40',
    isAdmin: true
  };

  // Sample threads for selected category
  const [threads, setThreads] = useState([
    {
      id: 101,
      categoryId: 1,
      title: "Welcome to our community forum!",
      author: "Admin",
      authorId: "admin1",
      authorAvatar: "https://via.placeholder.com/40",
      createdAt: "2025-03-10T09:00:00",
      lastReplyAt: "2025-03-14T10:30:00",
      lastReplyBy: "Jane Smith",
      replies: 8,
      views: 152,
      isPinned: true
    },
    {
      id: 102,
      categoryId: 1,
      title: "Community guidelines - please read",
      author: "Admin",
      authorId: "admin1",
      authorAvatar: "https://via.placeholder.com/40",
      createdAt: "2025-03-10T09:15:00",
      lastReplyAt: "2025-03-13T16:45:00",
      lastReplyBy: "Mark Johnson",
      replies: 5,
      views: 134,
      isPinned: true
    },
    {
      id: 103,
      categoryId: 1,
      title: "Monthly maintenance schedule",
      author: "Jane Smith",
      authorId: "user456",
      authorAvatar: "https://via.placeholder.com/40",
      createdAt: "2025-03-12T14:20:00",
      lastReplyAt: "2025-03-14T09:30:00",
      lastReplyBy: "Chris Lee",
      replies: 12,
      views: 89,
      isPinned: false
    },
    {
      id: 104,
      categoryId: 1,
      title: "Suggestions for community garden",
      author: "Mark Johnson",
      authorId: "user789",
      authorAvatar: "https://via.placeholder.com/40",
      createdAt: "2025-03-13T11:10:00",
      lastReplyAt: "2025-03-14T10:30:00",
      lastReplyBy: "Sarah Williams",
      replies: 15,
      views: 72,
      isPinned: false
    },
    // More threads for other categories...
    {
      id: 105,
      categoryId: 3,
      title: "Plumbing issues in Block C",
      author: "Chris Lee",
      authorId: "user321",
      authorAvatar: "https://via.placeholder.com/40",
      createdAt: "2025-03-14T08:45:00",
      lastReplyAt: "2025-03-15T08:45:00",
      lastReplyBy: "Maintenance Team",
      replies: 7,
      views: 38,
      isPinned: false
    }
  ]);

  // Sample messages for active thread
  const [messages, setMessages] = useState([
    {
      id: 1001,
      threadId: 101,
      authorId: "admin1",
      author: "Admin",
      authorAvatar: "https://via.placeholder.com/40",
      content: "Welcome everyone to our community forum! This is a place for us to discuss community matters, share ideas, and connect with neighbors. Please feel free to introduce yourselves and let's build a strong community together.",
      timestamp: "2025-03-10T09:00:00",
      isEdited: false
    },
    {
      id: 1002,
      threadId: 101,
      authorId: "user456",
      author: "Jane Smith",
      authorAvatar: "https://via.placeholder.com/40",
      content: "Thanks for creating this forum! I'm Jane, I've been living in the community for 3 years now. Looking forward to connecting with everyone!",
      timestamp: "2025-03-10T10:15:00",
      isEdited: false
    },
    {
      id: 1003,
      threadId: 101,
      authorId: "user789",
      author: "Mark Johnson",
      authorAvatar: "https://via.placeholder.com/40",
      content: "Hello everyone! I'm Mark, new to the community. I moved in last month and am excited to get to know my neighbors!",
      timestamp: "2025-03-10T11:30:00",
      isEdited: false
    },
    {
      id: 1004,
      threadId: 101,
      authorId: "user321",
      author: "Chris Lee",
      authorAvatar: "https://via.placeholder.com/40",
      content: "Hi all, I'm Chris from Block B. I've been here for 5 years and would love to help new residents with any questions!",
      timestamp: "2025-03-10T14:45:00",
      isEdited: false
    },
    {
      id: 1005,
      threadId: 101,
      authorId: "user123",
      author: "John Doe",
      authorAvatar: "https://via.placeholder.com/40",
      content: "Hello everyone! I'm John, excited to join this community forum. Looking forward to our discussions!",
      timestamp: "2025-03-14T10:30:00",
      isEdited: false
    }
  ]);

  // Function to filter threads by category
  const getThreadsByCategory = (categoryId) => {
    return threads.filter(thread => thread.categoryId === categoryId);
  };

  // Function to get messages by thread
  const getMessagesByThread = (threadId) => {
    return messages.filter(message => message.threadId === threadId);
  };

  // Function to format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Function to handle sending a new message
  const handleSendMessage = () => {
    if (newMessageText.trim() === '') return;

    const newMessage = {
      id: messages.length + 1006,
      threadId: activeThread.id,
      authorId: currentUser.id,
      author: currentUser.name,
      authorAvatar: currentUser.avatar,
      content: newMessageText,
      timestamp: new Date().toISOString(),
      isEdited: false
    };

    setMessages([...messages, newMessage]);
    setNewMessageText('');

    // Update last reply in thread
    setThreads(threads.map(thread => {
      if (thread.id === activeThread.id) {
        return {
          ...thread,
          lastReplyAt: new Date().toISOString(),
          lastReplyBy: currentUser.name,
          replies: thread.replies + 1
        };
      }
      return thread;
    }));

    // Update last activity in category
    setCategories(categories.map(category => {
      if (category.id === activeCategory.id) {
        return {
          ...category,
          lastActivity: new Date().toISOString(),
          posts: category.posts + 1
        };
      }
      return category;
    }));
  };

  // Function to delete a message
  const handleDeleteMessage = (messageId) => {
    // Ask for confirmation before deleting
    if (window.confirm('Are you sure you want to delete this message?')) {
      setMessages(messages.filter(message => message.id !== messageId));

      // Update thread reply count
      setThreads(threads.map(thread => {
        if (thread.id === activeThread.id) {
          return {
            ...thread,
            replies: thread.replies - 1
          };
        }
        return thread;
      }));

      // Update category post count
      setCategories(categories.map(category => {
        if (category.id === activeCategory.id) {
          return {
            ...category,
            posts: category.posts - 1
          };
        }
        return category;
      }));
    }
  };

  // Scroll to bottom of messages when new message is added
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Discussion Forums</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <nav className="flex mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-4">
            <li>
              <div>
                <button
                  onClick={() => {
                    setActiveCategory(null);
                    setActiveThread(null);
                  }}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Forums
                </button>
              </div>
            </li>
            {activeCategory && (
              <>
                <li>
                  <div className="flex items-center">
                    <svg className="flex-shrink-0 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                    <button
                      onClick={() => setActiveThread(null)}
                      className="ml-4 text-blue-600 hover:text-blue-800"
                    >
                      {activeCategory.name}
                    </button>
                  </div>
                </li>
              </>
            )}
            {activeThread && (
              <li>
                <div className="flex items-center">
                  <svg className="flex-shrink-0 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="ml-4 text-gray-500">{activeThread.title}</span>
                </div>
              </li>
            )}
          </ol>
        </nav>

        {/* Categories List */}
        {!activeCategory && !activeThread && (
          <div className="space-y-6">
            {categories.map((category) => (
              <div key={category.id} className="bg-white rounded-lg shadow overflow-hidden">
                <div
                  className="p-6 cursor-pointer hover:bg-gray-50"
                  onClick={() => setActiveCategory(category)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">{category.name}</h2>
                      <p className="mt-1 text-gray-600">{category.description}</p>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div>
                        <span className="font-medium">{category.threads}</span> threads
                      </div>
                      <div>
                        <span className="font-medium">{category.posts}</span> posts
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 text-sm text-gray-500">
                    Last activity: {formatDate(category.lastActivity)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Threads List */}
        {activeCategory && !activeThread && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">{activeCategory.name}</h2>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                New Thread
              </button>
            </div>

            <p className="text-gray-600 mb-6">{activeCategory.description}</p>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="divide-y divide-gray-200">
                {getThreadsByCategory(activeCategory.id).map((thread) => (
                  <div
                    key={thread.id}
                    className={`p-6 cursor-pointer hover:bg-gray-50 ${thread.isPinned ? 'bg-blue-50' : ''}`}
                    onClick={() => setActiveThread(thread)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <img className="h-10 w-10 rounded-full" src={thread.authorAvatar} alt={thread.author} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          {thread.isPinned && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Pinned
                            </span>
                          )}
                          <h3 className="text-lg font-medium text-gray-900 truncate">{thread.title}</h3>
                        </div>
                        <div className="mt-1 flex items-center text-sm text-gray-500">
                          <span>Started by {thread.author} • {formatDate(thread.createdAt)}</span>
                        </div>
                      </div>
                      <div className="flex-shrink-0 flex flex-col items-end space-y-1 text-sm text-gray-500">
                        <div>
                          <span className="font-medium">{thread.replies}</span> replies
                        </div>
                        <div>
                          <span className="font-medium">{thread.views}</span> views
                        </div>
                        <div>
                          Last reply by {thread.lastReplyBy}
                        </div>
                        <div>
                          {formatDate(thread.lastReplyAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Thread Messages */}
        {activeThread && (
          <div className="flex flex-col space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-900">{activeThread.title}</h2>
              <div className="mt-2 text-sm text-gray-500">
                Started by {activeThread.author} • {formatDate(activeThread.createdAt)} • {activeThread.replies} replies • {activeThread.views} views
              </div>
            </div>

            <div className="bg-white rounded-lg shadow">
              <div className="divide-y divide-gray-200">
                {getMessagesByThread(activeThread.id).map((message) => (
                  <div key={message.id} className="p-6">
                    <div className="flex space-x-3">
                      <div className="flex-shrink-0">
                        <img className="h-10 w-10 rounded-full" src={message.authorAvatar} alt={message.author} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{message.author}</p>
                            <p className="text-sm text-gray-500">
                              {formatDate(message.timestamp)}
                              {message.isEdited && <span className="ml-2 text-xs">(edited)</span>}
                            </p>
                          </div>

                          {/* Message actions */}
                          {(currentUser.isAdmin || message.authorId === currentUser.id) && (
                            <div className="flex space-x-2">
                              <button
                                className="text-gray-400 hover:text-gray-600"
                                title="Edit message"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                </svg>
                              </button>
                              <button
                                className="text-red-400 hover:text-red-600"
                                title="Delete message"
                                onClick={() => handleDeleteMessage(message.id)}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="mt-3 text-sm text-gray-800 whitespace-pre-wrap">
                          {message.content}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Reply Box */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Post a Reply</h3>
              <div className="space-y-4">
                <textarea
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="4"
                  placeholder="Write your reply..."
                  value={newMessageText}
                  onChange={(e) => setNewMessageText(e.target.value)}
                ></textarea>
                <div className="flex justify-end">
                  <button
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
                    disabled={newMessageText.trim() === ''}
                    onClick={handleSendMessage}
                  >
                    Post Reply
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}