import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import { getSetting, upsertSetting } from '../../apiClient'; // <-- NEW: Import API functions

// قائمة مبسطة باللغات الشائعة مع رموزها
const supportedLanguages = [
  { code: 'auto', name: 'اكتشاف تلقائي (Default)' },
  { code: 'ar', name: 'العربية' },
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'es', name: 'Español' },
  { code: 'tr', name: 'Türkçe' },
];

function AudioSettingsModal({ closeModal }) {
  const [transcriptionLang, setTranscriptionLang] = useState('auto');
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState({ message: '', error: false });

  // **UPDATED:** Fetch the saved setting when the modal opens
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await getSetting('transcription_language');
        if (response.data && response.data.value) {
          setTranscriptionLang(response.data.value);
        }
      } catch (err) {
        console.error("Failed to fetch audio settings", err);
        setStatus({ message: 'فشل في تحميل الإعدادات الحالية.', error: true });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSettings();
  }, []);

  // **UPDATED:** Implement the actual save logic
  const handleSave = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus({ message: '', error: false });
    
    try {
      await upsertSetting('transcription_language', transcriptionLang);
      setStatus({ message: 'تم حفظ الإعدادات بنجاح!', error: false });
      setTimeout(() => closeModal(), 1500);
    } catch (err) {
      console.error("Failed to save audio settings", err);
      setStatus({ message: 'فشل في حفظ الإعدادات.', error: true });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>إعدادات الصوت</h2>
          <button className="modal-close-button" onClick={closeModal}>
            <FaTimes />
          </button>
        </div>
        
        {isLoading && !status.message ? ( // Show loading only if there's no status message yet
          <p>جاري تحميل الإعدادات...</p>
        ) : (
          <form onSubmit={handleSave}>
            <div className="form-group">
              <label htmlFor="transcription-lang">لغة الإدخال الصوتي (Transcription)</label>
              <select 
                id="transcription-lang" 
                value={transcriptionLang} 
                onChange={(e) => setTranscriptionLang(e.target.value)} 
                className="form-input"
                disabled={isLoading}
              >
                {supportedLanguages.map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
              <p className="description">
                تحديد اللغة مسبقاً يحسن من دقة تحويل الصوت إلى نص. "الاكتشاف التلقائي" هو الخيار الافتراضي.
              </p>
            </div>

            <button type="submit" className="button-primary" disabled={isLoading}>
              {isLoading ? "جاري الحفظ..." : "حفظ الإعدادات"}
            </button>
            {status.message && (
              <p 
                className={`status-message ${status.error ? 'error' : ''}`} 
                style={{color: status.error ? '' : 'green'}}
              >
                {status.message}
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}

export default AudioSettingsModal;