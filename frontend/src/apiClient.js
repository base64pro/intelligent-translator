import axios from 'axios';

// Get the base URL from environment variables
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- NEW: Auth APIs ---
// Function to set the authentication token in future requests
export const setAuthToken = (token) => {
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
  }
};

// Login API call
export const loginUser = async (username, password) => {
  const formData = new URLSearchParams();
  formData.append('username', username);
  formData.append('password', password);

  const response = await apiClient.post('/api/v1/token', formData.toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
  return response.data;
};

// Register API call
export const registerUser = (userData) => {
  return apiClient.post('/api/v1/register', userData);
};

// Get current user profile (protected endpoint)
export const getCurrentUser = () => {
  return apiClient.get('/api/v1/users/me/');
};

// Update user password (protected endpoint)
export const changePassword = (old_password, new_password) => {
  return apiClient.put('/api/v1/users/me/password', { old_password, new_password });
};


// --- Conversation APIs ---
export const getConversations = () => apiClient.get('/api/v1/conversations/');
export const getArchivedConversations = () => apiClient.get('/api/v1/conversations/archived');
export const createConversation = (title) => apiClient.post('/api/v1/conversations/', { title });
export const getConversationById = (id) => apiClient.get(`/api/v1/conversations/${id}`);
export const exportConversation = (id) => apiClient.get(`/api/v1/conversations/${id}/export`);
export const addMessageToConversation = (id, text, targetLang) => {
  const requestBody = { text_to_translate: text, target_language: targetLang };
  return apiClient.post(`/api/v1/conversations/${id}/translate`, requestBody);
};
export const updateConversationSettings = (id, settings) => {
  return apiClient.patch(`/api/v1/conversations/${id}/settings`, settings);
};
export const renameConversation = (id, title) => {
  return apiClient.patch(`/api/v1/conversations/${id}/rename`, { title });
};
export const deleteConversation = (id) => {
  return apiClient.delete(`/api/v1/conversations/${id}`);
};
export const archiveConversation = (id, is_archived) => {
  return apiClient.patch(`/api/v1/conversations/${id}/archive`, { is_archived });
};

// --- Message Actions ---
export const editMessage = (id, newText) => {
  return apiClient.patch(`/api/v1/messages/${id}`, { original_text: newText });
};
export const deleteMessage = (id) => {
  return apiClient.delete(`/api/v1/messages/${id}`);
};

// --- Audio Transcription API ---
export const transcribeAudio = (audioBlob) => {
  const formData = new FormData();
  formData.append("audio_file", audioBlob, "recording.webm");

  return apiClient.post('/api/v1/transcribe', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

// --- Text-to-Speech API ---
export const callTextToSpeechApi = (text) => {
  return apiClient.post('/api/v1/text-to-speech', { text }, { responseType: 'blob' });
};

// --- General Settings APIs ---
export const upsertSetting = (key, value) => {
  return apiClient.post('/api/v1/settings', { key, value });
};
export const getSetting = (key) => {
  return apiClient.get(`/api/v1/settings/${key}`);
};

// --- User Profile APIs ---
export const getUserProfile = () => {
  return apiClient.get('/api/v1/profile');
};
export const updateUserProfile = (profileData) => {
  return apiClient.post('/api/v1/profile', profileData);
};

// --- Prompt Library APIs ---
export const getPrompts = () => apiClient.get('/api/v1/prompts/');
export const createPrompt = (promptData) => apiClient.post('/api/v1/prompts/', promptData);
export const updatePrompt = (id, promptData) => apiClient.put(`/api/v1/prompts/${id}`, promptData);
export const deletePrompt = (id) => apiClient.delete(`/api/v1/prompts/${id}`);

// --- Custom Dictionary APIs ---
export const getDictionaryEntries = () => apiClient.get('/api/v1/dictionary/');
export const createDictionaryEntry = (entryData) => apiClient.post('/api/v1/dictionary/', entryData);
export const updateDictionaryEntry = (id, entryData) => apiClient.put(`/api/v1/dictionary/${id}`, entryData);
export const deleteDictionaryEntry = (id) => apiClient.delete(`/api/v1/dictionary/${id}`);

// --- NEW: Notes APIs ---
export const createNoteForConversation = (conversationId, content) => {
    return apiClient.post(`/api/v1/conversations/${conversationId}/notes/`, { content });
};
export const getNotesForConversation = (conversationId) => {
    return apiClient.get(`/api/v1/conversations/${conversationId}/notes/`);
};
export const updateNote = (noteId, content) => {
    return apiClient.put(`/api/v1/notes/${noteId}`, { content });
};
export const deleteNote = (noteId) => {
    return apiClient.delete(`/api/v1/notes/${noteId}`);
};