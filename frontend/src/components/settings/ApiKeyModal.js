import React, { useState } from 'react';
import { upsertSetting } from '../../apiClient';
import { FaTimes } from 'react-icons/fa';

function ApiKeyModal({ closeModal }) {
  const [apiKey, setApiKey] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSaveKey = async (e) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      setError("حقل المفتاح لا يمكن أن يكون فارغاً.");
      return;
    }
    
    setIsLoading(true);
    setError('');
    setSaveMessage('');

    try {
      await upsertSetting("openai_api_key", apiKey);
      setSaveMessage('تم حفظ مفتاح API بنجاح!');
      setApiKey(''); // Clear input for security
      setTimeout(() => {
        closeModal();
      }, 1500);
    } catch (err) {
      setError('فشل في حفظ المفتاح.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>إدارة مفتاح API</h2>
          <button className="modal-close-button" onClick={closeModal}>
            <FaTimes />
          </button>
        </div>
        <form onSubmit={handleSaveKey}>
          <div className="form-group">
            <label htmlFor="api-key-input">مفتاح OpenAI API</label>
            <input
              id="api-key-input"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="form-input"
              style={{ direction: 'ltr', textAlign: 'left' }}
            />
             <p className="description">سيتم حفظ مفتاحك بشكل آمن في قاعدة بيانات التطبيق.</p>
          </div>
          <button type="submit" className="button-primary" disabled={isLoading}>
            {isLoading ? "جاري الحفظ..." : "حفظ المفتاح"}
          </button>
          {saveMessage && <p className="status-message" style={{ color: 'green' }}>{saveMessage}</p>}
          {error && <p className="status-message error">{error}</p>}
        </form>
      </div>
    </div>
  );
}

export default ApiKeyModal;