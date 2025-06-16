import React, { useState, useEffect } from 'react';
import { upsertSetting, getSetting } from '../../apiClient';
import { FaTimes } from 'react-icons/fa';

function ModelSettingsModal({ closeModal }) {
  const [translationModel, setTranslationModel] = useState('gpt-4o-mini');
  const [ttsModel, setTtsModel] = useState('tts-1');
  const [ttsVoice, setTtsVoice] = useState('alloy');
  
  const [status, setStatus] = useState({ message: '', error: false });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const [transModelRes, ttsModelRes, ttsVoiceRes] = await Promise.all([
          getSetting('translation_model'),
          getSetting('tts_model'),
          getSetting('tts_voice')
        ]);

        if (transModelRes.data && transModelRes.data.value) {
          setTranslationModel(transModelRes.data.value);
        }
        if (ttsModelRes.data && ttsModelRes.data.value) {
          setTtsModel(ttsModelRes.data.value);
        }
        if (ttsVoiceRes.data && ttsVoiceRes.data.value) {
          setTtsVoice(ttsVoiceRes.data.value);
        }
      } catch (err) {
        console.error("Failed to fetch settings", err);
        setStatus({ message: 'فشل في تحميل الإعدادات الحالية.', error: true });
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus({ message: '', error: false });
    try {
      await Promise.all([
        upsertSetting('translation_model', translationModel),
        upsertSetting('tts_model', ttsModel),
        upsertSetting('tts_voice', ttsVoice)
      ]);
      setStatus({ message: 'تم حفظ الإعدادات بنجاح!', error: false });
      setTimeout(() => {
        closeModal();
      }, 1500);
    } catch (err)      {
      setStatus({ message: 'فشل في حفظ الإعدادات.', error: true });
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>إعدادات النماذج</h2>
          <button className="modal-close-button" onClick={closeModal}>
            <FaTimes />
          </button>
        </div>
        
        {isLoading && <p>جاري تحميل الإعدادات...</p>}

        {!isLoading && (
          <form onSubmit={handleSave}>
            <div className="form-group">
              <label htmlFor="translation-model">نموذج الترجمة (Translation Model)</label>
              <select id="translation-model" value={translationModel} onChange={(e) => setTranslationModel(e.target.value)} className="form-input">
                <option value="gpt-4o-mini">GPT-4o Mini (الأسرع والأقل تكلفة)</option>
                <option value="gpt-4o">GPT-4o (الأذكى والأكثر دقة)</option>
                <option value="gpt-4-turbo">GPT-4-Turbo (خيار متقدم إضافي)</option>
              </select>
              <p className="description">اختر نموذج الذكاء الاصطناعي المستخدم في الترجمة.</p>
            </div>

            <div className="form-group">
              <label htmlFor="tts-model">نموذج الصوت (TTS Model)</label>
              <select id="tts-model" value={ttsModel} onChange={(e) => setTtsModel(e.target.value)} className="form-input">
                <option value="tts-1">TTS-1 (جودة قياسية وسريعة)</option>
                <option value="tts-1-hd">TTS-1-HD (جودة عالية)</option>
              </select>
              <p className="description">اختر جودة الصوت عند تحويل النص إلى كلام.</p>
            </div>

            <div className="form-group">
              <label htmlFor="tts-voice">نوع الصوت (TTS Voice)</label>
              <select id="tts-voice" value={ttsVoice} onChange={(e) => setTtsVoice(e.target.value)} className="form-input">
                <option value="alloy">Alloy</option>
                <option value="echo">Echo</option>
                <option value="fable">Fable</option>
                <option value="onyx">Onyx</option>
                <option value="nova">Nova</option>
                <option value="shimmer">Shimmer</option>
              </select>
              <p className="description">اختر الصوت الذي تفضله للاستماع إلى الترجمة.</p>
            </div>

            <button type="submit" className="button-primary" disabled={isLoading}>
              {isLoading ? "جاري الحفظ..." : "حفظ الإعدادات"}
            </button>
            {status.message && <p className={`status-message ${status.error ? 'error' : ''}`} style={{color: status.error ? '' : 'green'}}>{status.message}</p>}
          </form>
        )}
      </div>
    </div>
  );
}

export default ModelSettingsModal;