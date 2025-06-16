import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import TextareaAutosize from 'react-textarea-autosize';
import { 
  getConversationById, 
  addMessageToConversation, 
  updateConversationSettings, 
  callTextToSpeechApi,
  editMessage,
  deleteMessage,
  exportConversation,
  transcribeAudio,
  getPrompts
} from '../apiClient';
import { 
  FaPaperPlane, FaVolumeUp, FaSpinner, FaExchangeAlt, 
  FaCog, FaTimes, FaEdit, FaTrash,
  FaCopy, FaDownload, FaShareAlt,
  FaFileExport, FaMicrophone, FaStop, FaPaperclip
} from 'react-icons/fa';
import './WorkspacePage.scss';

const sourceLanguages = [
    { code: 'auto', name: 'اكتشاف تلقائي' },
    { code: 'ar', name: 'العربية' },
    { code: 'en', name: 'English' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'es', name: 'Español' },
];
const targetLanguages = [
    { code: 'en', name: 'English' },
    { code: 'ar', name: 'العربية' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'es', name: 'Español' },
];
const highlightText = (text, query) => {
  if (!query) {
    return text;
  }
  const parts = text.split(new RegExp(`(${query})`, 'gi'));
  return (
    <span>
      {parts.map((part, index) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={index}>{part}</mark>
        ) : (
          part
        )
      )}
    </span>
  );
};


function WorkspacePage() {
    const { id } = useParams();
    const [conversation, setConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [error, setError] = useState('');
    const [playingAudioId, setPlayingAudioId] = useState(null);
    const [sourceLang, setSourceLang] = useState('auto');
    const [targetLang, setTargetLang] = useState('en');

    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [currentUseContext, setCurrentUseContext] = useState(true);
    const [currentCustomPrompt, setCurrentCustomPrompt] = useState('');
    const [saveSettingsStatus, setSaveSettingsStatus] = useState('');
    const [editingMessage, setEditingMessage] = useState({ id: null, text: '' });
    const [messageSearchQuery, setMessageSearchQuery] = useState('');
    
    const [copyStatus, setCopyStatus] = useState({ id: null, type: null });
    
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const micButtonRef = useRef(null);
    const fileInputRef = useRef(null);

    const [promptLibrary, setPromptLibrary] = useState([]);
    const messagesEndRef = useRef(null);
    const audioRef = useRef(null);

    useEffect(() => {
        const fetchConversation = async () => {
            try {
                const response = await getConversationById(id);
                setConversation(response.data);
                setMessages(response.data.messages);
                setCurrentUseContext(response.data.use_context);
                setCurrentCustomPrompt(response.data.custom_prompt || '');
            } catch (err) {
                setError('فشل في تحميل المحادثة.');
                console.error(err);
            }
        };
        if (id) {
            fetchConversation();
        }
    }, [id]);

    useEffect(() => {
        if (!messageSearchQuery) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, messageSearchQuery]);

    // **تم حذف الـ useEffect الخاص باللمس لأنه سيتم التعامل معه مباشرة في الزر**
    
    useEffect(() => {
      if (isSettingsOpen) {
        const fetchPromptLibrary = async () => {
          try {
            const response = await getPrompts();
            setPromptLibrary(response.data);
          } catch (err) {
            console.error("Failed to fetch prompt library", err);
           }
        };
        fetchPromptLibrary();
      }
    }, [isSettingsOpen]);

    const handleSwapLanguages = () => {
        if (sourceLang === 'auto') return;
        const newSourceLang = targetLang;
        const newTargetLang = sourceLang;
        setSourceLang(newSourceLang);
        setTargetLang(newTargetLang);
    };

    const handleTranslate = async (e) => {
        if (e) e.preventDefault();
        if (!inputText.trim() || isLoading) return;

        const tempId = Date.now();
        const optimisticMessage = {
            id: tempId,
            original_text: inputText,
            translated_text: "جاري الترجمة...",
            created_at: new Date().toISOString(),
            status: 'pending'
        };

        setMessages(prevMessages => [...prevMessages, optimisticMessage]);
        setInputText('');
        setIsLoading(true);
        setError('');

        try {
            const targetLanguageName = targetLanguages.find(lang => lang.code === targetLang)?.name || 'English';
            const response = await addMessageToConversation(id, optimisticMessage.original_text, targetLanguageName);
            setMessages(prevMessages => 
                prevMessages.map(msg => msg.id === tempId ? response.data : msg)
            );
        } catch (apiError) {
            console.error("API call failed:", apiError);
            const errorDetail = apiError.response?.data?.detail || "فشل في إرسال الرسالة.";
            setError(errorDetail);
            setMessages(prevMessages => 
                prevMessages.map(msg => msg.id === tempId ? { ...msg, status: 'error', translated_text: 'فشلت الترجمة' } : msg)
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteMessage = async (messageId) => {
        if (window.confirm('هل أنت متأكد من حذف هذه الرسالة؟')) {
            try {
                await deleteMessage(messageId);
                setMessages(prev => prev.filter(msg => msg.id !== messageId));
            } catch (err) {
                setError('فشل في حذف الرسالة.');
                console.error(err);
            }
        }
    };

    const handleStartEditing = (message) => {
        setEditingMessage({ id: message.id, text: message.original_text });
    };

    const handleCancelEditing = () => {
        setEditingMessage({ id: null, text: '' });
    };

    const handleSaveEdit = async () => {
        if (!editingMessage.text.trim()) return;
        setIsLoading(true);
        try {
            const response = await editMessage(editingMessage.id, editingMessage.text);
            setMessages(prev => prev.map(msg => msg.id === editingMessage.id ? response.data : msg));
            handleCancelEditing();
        } catch (err) {
            setError('فشل في تعديل الرسالة.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePlayAudio = async (text, messageId) => {
        if (playingAudioId === messageId) {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
            setPlayingAudioId(null);
            return;
        }

        setPlayingAudioId(messageId);
        try {
            const response = await callTextToSpeechApi(text);
            const audioBlob = response.data;
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            audioRef.current = audio;
            audio.play();
            audio.onended = () => { setPlayingAudioId(null); };
            audio.onerror = (e) => {
                console.error("Audio playback error:", e);
                setError('حدث خطأ أثناء تشغيل الصوت.');
                setPlayingAudioId(null);
            }
        } catch (err) {
            setError('فشل في توليد الصوت.');
            setPlayingAudioId(null);
        }
    };

    const handleSaveSettings = async () => {
        setSaveSettingsStatus('جاري الحفظ...');
        try {
            const settingsToUpdate = {
                use_context: currentUseContext,
                custom_prompt: currentCustomPrompt,
            };
            const response = await updateConversationSettings(id, settingsToUpdate);
            setConversation(response.data);
            setSaveSettingsStatus('تم الحفظ بنجاح!');
            setTimeout(() => {
                setIsSettingsOpen(false);
                setSaveSettingsStatus('');
            }, 1500);
        } catch (err) {
            setSaveSettingsStatus('فشل الحفظ. حاول مرة أخرى.');
            console.error("Failed to save settings:", err);
        }
    };

    const handleCopyText = (text, messageId, type) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopyStatus({ id: messageId, type: type });
            setTimeout(() => setCopyStatus({ id: null, type: null }), 2000);
        }, (err) => {
            console.error('Could not copy text: ', err);
            setError('فشل نسخ النص.');
        });
    };

    const handleShareText = async (text) => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'ترجمة من المترجم الذكي',
                    text: text,
                });
            } catch (err) {
                console.error('Error sharing:', err);
            }
        } else {
            setError('المشاركة غير مدعومة في هذا المتصفح.');
        }
    };

    const handleDownloadAudio = async (text) => {
        setIsLoading(true);
        setError('');
        try {
            const response = await callTextToSpeechApi(text);
            const audioBlob = response.data;
            const url = window.URL.createObjectURL(audioBlob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `translation-${Date.now()}.mp3`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            setError('فشل في تنزيل الملف الصوتي.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            const response = await exportConversation(id);
            const textBlob = new Blob([response.data], { type: 'text/plain;charset=utf-8' });
            const url = window.URL.createObjectURL(textBlob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${conversation.title.replace(/\s/g, '_')}.txt`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            setError('فشل في تصدير المحادثة.');
            console.error("Failed to export conversation:", err);
        }
    };

    const transcribeFile = useCallback(async (file) => {
        if (!file) return;
        setIsTranscribing(true);
        setError('');
        try {
            const response = await transcribeAudio(file);
            setInputText(prev => prev.trim() ? prev + ' ' + response.data.transcribed_text : response.data.transcribed_text);
        } catch (err) {
            const errorDetail = err.response?.data?.detail || 'فشل في تحويل الصوت إلى نص.';
            setError(errorDetail);
            console.error("Transcription failed:", err);
        } finally {
            setIsTranscribing(false);
        }
    }, []);

    // --- **التعديل الجوهري**: دمج منطق البدء والإيقاف في دالة واحدة للتبديل (toggle) ---
    const handleToggleRecording = useCallback(async () => {
        // إذا كان التسجيل يعمل حاليًا، قم بإيقافه
        if (isRecording) {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
                mediaRecorderRef.current.stop();
            }
            // سيتم تحديث isRecording إلى false في onstop
            return;
        }

        // إذا لم يكن التسجيل يعمل، قم ببدئه
        setError('');
        if (isTranscribing) return;
        
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                setIsRecording(true);
                mediaRecorderRef.current = new MediaRecorder(stream);
                mediaRecorderRef.current.ondataavailable = (event) => {
                    audioChunksRef.current.push(event.data);
                };
                mediaRecorderRef.current.onstop = async () => {
                    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                    audioChunksRef.current = [];
                    stream.getTracks().forEach(track => track.stop());
                    setIsRecording(false); // تحديث الحالة بعد إيقاف المسار
                    if (audioBlob.size > 0) {
                        await transcribeFile(audioBlob);
                    }
                };
                mediaRecorderRef.current.start();
            } catch (err) {
                console.error("Error accessing microphone:", err);
                setError("لا يمكن الوصول إلى الميكروفون. يرجى التحقق من الأذونات.");
                setIsRecording(false);
            }
        } else {
            setError("المتصفح لا يدعم التسجيل الصوتي.");
        }
    }, [isRecording, isTranscribing, transcribeFile]);

    // --- تم حذف الدوال القديمة handleStartRecording و handleStopRecording ---

    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (file) {
            transcribeFile(file);
        }
        event.target.value = null; 
    };

    const handleUploadClick = () => {
        if (isTranscribing) return;
        fileInputRef.current.click();
    };

    const renderInputActions = () => {
        if (isTranscribing) {
            return (
                <button type="button" className="mic-button" disabled>
                    <FaSpinner className="fa-spin" />
                </button>
            );
        }
        if (inputText.trim()) {
            return (
                <button type="submit" className="translate-button" disabled={isLoading}>
                    {isLoading ? <FaSpinner className="fa-spin"/> : <FaPaperPlane />}
                </button>
            );
        }
        return (
            <>
                <button type="button" className="mic-button" onClick={handleUploadClick} title="تحميل ملف صوتي">
                    <FaPaperclip />
                </button>
                {/* --- **التعديل الجوهري**: استخدام onClick فقط للتبديل --- */}
                <button 
                    ref={micButtonRef}
                    type="button" 
                    className={`mic-button ${isRecording ? 'recording' : ''}`} 
                    onClick={handleToggleRecording}
                    title={isRecording ? "إيقاف التسجيل" : "بدء التسجيل"}
                >
                    {isRecording ? <FaStop /> : <FaMicrophone />}
                </button>
            </>
        );
    };

    if (!conversation) {
        return <div className="page-container">جاري تحميل المحادثة...</div>;
    }

    return (
        <>
            <div className="page-container workspace-container">
                <div className="workspace-header">
                    <div className="header-top-row">
                        <h1>{conversation.title}</h1>
                        <div className="header-actions">
                             <button className="icon-button" onClick={handleExport} title="تصدير المحادثة">
                                <FaFileExport />
                            </button>
                            <button className="icon-button" onClick={() => setIsSettingsOpen(true)} title="إعدادات المحادثة">
                                <FaCog />
                            </button>
                        </div>
                    </div>
                    <div className="header-bottom-row">
                         <input 
                            type="text"
                            placeholder="ابحث في الرسائل..."
                            className="message-search-bar"
                            value={messageSearchQuery}
                            onChange={(e) => setMessageSearchQuery(e.target.value)}
                        />
                        <div className="language-controls">
                            <select className="language-select" value={sourceLang} onChange={(e) => setSourceLang(e.target.value)}>
                                {sourceLanguages.map(lang => (
                                    <option key={lang.code} value={lang.code}>{lang.name}</option>
                                ))}
                            </select>
                            <button className="swap-languages-button" onClick={handleSwapLanguages} title="تبديل اللغات" disabled={sourceLang === 'auto'}>
                                <FaExchangeAlt />
                            </button>
                             <select className="language-select" value={targetLang} onChange={(e) => setTargetLang(e.target.value)}>
                                {targetLanguages.map(lang => (
                                    <option key={lang.code} value={lang.code}>{lang.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
                
                <div className="message-history">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`message-pair ${msg.status || ''}`}>
                            <div className="message original-message">
                                {editingMessage.id === msg.id ? (
                                    <div className="edit-container">
                                        <textarea className="edit-textarea" value={editingMessage.text} onChange={(e) => setEditingMessage({ ...editingMessage, text: e.target.value })} autoFocus />
                                        <div className="edit-buttons">
                                            <button className="button-primary" onClick={handleSaveEdit} disabled={isLoading}>{isLoading ? 'جاري...' : 'حفظ'}</button>
                                            <button onClick={handleCancelEditing}>إلغاء</button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <span className="message-content">{highlightText(msg.original_text, messageSearchQuery)}</span>
                                        <div className="message-actions">
                                            <button onClick={() => handleCopyText(msg.original_text, msg.id, 'original')} title="نسخ">
                                                {copyStatus.id === msg.id && copyStatus.type === 'original' ? 'تم!' : <FaCopy />}
                                            </button>
                                            <button onClick={() => handleStartEditing(msg)} title="تعديل"><FaEdit /></button>
                                            <button onClick={() => handleDeleteMessage(msg.id)} title="حذف"><FaTrash /></button>
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="message translated-message">
                                <span className="message-content">
                                    {msg.status === 'pending' && <FaSpinner className="fa-spin message-spinner" />}
                                    {highlightText(msg.translated_text, messageSearchQuery)}
                                </span>
                                {msg.status !== 'pending' && msg.status !== 'error' && (
                                  <div className="message-actions">
                                      <button onClick={() => handleCopyText(msg.translated_text, msg.id, 'translated')} title="نسخ النص">
                                        {copyStatus.id === msg.id && copyStatus.type === 'translated' ? 'تم النسخ!' : <FaCopy />}
                                    </button>
                                    <button className="play-audio-button" onClick={() => handlePlayAudio(msg.translated_text, msg.id)} title="الاستماع للترجمة">
                                        {playingAudioId === msg.id ? <FaSpinner className="fa-spin" /> : <FaVolumeUp />}
                                    </button>
                                    <button onClick={() => handleDownloadAudio(msg.translated_text)} title="تنزيل الصوت">
                                        <FaDownload />
                                    </button>
                                    {navigator.share && (
                                      <button onClick={() => handleShareText(msg.translated_text)} title="مشاركة النص">
                                            <FaShareAlt />
                                        </button>
                                    )}
                                  </div>
                                )}
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {error && <div className="status-message error" onClick={() => setError('')}>{error}</div>}
                
                <form className="translation-input-area" onSubmit={handleTranslate}>
                    <TextareaAutosize 
                        className="text-area" 
                        value={inputText} 
                        onChange={(e) => setInputText(e.target.value)} 
                        placeholder={isTranscribing ? "جاري تفريغ الصوت..." : "اكتب النص..."}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleTranslate(null); } }} 
                        minRows={1}
                        maxRows={6}
                        cacheMeasurements
                        disabled={isTranscribing}
                    />
                    
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                        accept="audio/*"
                    />
                    
                    {renderInputActions()}

                </form>
            </div>
            {isSettingsOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>إعدادات المحادثة</h2>
                            <button className="modal-close-button" onClick={() => setIsSettingsOpen(false)}><FaTimes /></button>
                        </div>
                        <div className="form-group">
                            <label>تفعيل سياق المحادثة</label>
                            <div className="toggle-switch">
                                <input type="checkbox" id="context-toggle" checked={currentUseContext} onChange={(e) => setCurrentUseContext(e.target.checked)} />
                                <label htmlFor="context-toggle" className="switch-label">Toggle</label>
                                <span>{currentUseContext ? "مفعل" : "معطل"}</span>
                            </div>
                            <p className="description">عند التفعيل، سيتم إرسال الرسائل السابقة مع كل طلب جديد لتحسين دقة الترجمة.</p>
                        </div>
                         
                        <div className="form-group">
                            <label htmlFor="custom-prompt-select">برومبت مخصص</label>
                            <select 
                                id="custom-prompt-select"
                                className="form-input"
                                value={currentCustomPrompt}
                                onChange={(e) => setCurrentCustomPrompt(e.target.value)}
                            >
                                <option value="">بدون برومبت</option>
                                {promptLibrary.map(prompt => (
                                    <option key={prompt.id} value={prompt.content}>
                                        {prompt.title}
                                    </option>
                                ))}
                            </select>
                            <p className="description">اختر برومبت جاهز من مكتبتك لتطبيقه على هذه المحادثة.</p>
                        </div>

                        <button className="button-primary" onClick={handleSaveSettings}>حفظ الإعدادات</button>
                        {saveSettingsStatus && <p className="status-message" style={{ color: 'green' }}>{saveSettingsStatus}</p>}
                    </div>
                </div>
            )}
        </>
    );
}

export default WorkspacePage;