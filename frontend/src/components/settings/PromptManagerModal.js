import React, { useState, useEffect } from 'react';
import { FaTimes, FaPlus, FaEdit, FaTrash, FaStar, FaRegStar } from 'react-icons/fa';
import { getPrompts, createPrompt, updatePrompt, deletePrompt, getSetting, upsertSetting } from '../../apiClient';

function PromptManagerModal({ closeModal }) {
  // State for the list of all prompts
  const [prompts, setPrompts] = useState([]);
  // State for the ID of the default prompt
  const [defaultPromptId, setDefaultPromptId] = useState(null);

  // State for managing the current view ('list' or 'form')
  const [view, setView] = useState('list'); 
  // State for the prompt being edited (null for new)
  const [editingPrompt, setEditingPrompt] = useState(null); 
  
  // General loading and status states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Function to fetch all data from the backend
  const fetchData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const [promptsResponse, defaultPromptResponse] = await Promise.all([
        getPrompts(),
        getSetting('default_prompt_id')
      ]);
      setPrompts(promptsResponse.data);
      if (defaultPromptResponse.data && defaultPromptResponse.data.value) {
        setDefaultPromptId(parseInt(defaultPromptResponse.data.value, 10));
      }
    } catch (err) {
      setError('فشل في تحميل البرومبتات.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  const handleAddNew = () => {
    setEditingPrompt(null); // Clear any previous editing state
    setView('form');
  };

  const handleEdit = (prompt) => {
    setEditingPrompt(prompt);
    setView('form');
  };

  const handleDelete = async (promptId) => {
    if (window.confirm('هل أنت متأكد من حذف هذا البرومبت؟')) {
      try {
        await deletePrompt(promptId);
        // If the deleted prompt was the default, clear the setting
        if (promptId === defaultPromptId) {
            await upsertSetting('default_prompt_id', '');
            setDefaultPromptId(null);
        }
        fetchData(); // Refresh the list
      } catch (err) {
        setError('فشل في حذف البرومبت.');
        console.error(err);
      }
    }
  };

  const handleSetDefault = async (promptId) => {
    try {
      await upsertSetting('default_prompt_id', promptId.toString());
      setDefaultPromptId(promptId);
    } catch (err) {
      setError('فشل في تعيين البرومبت الافتراضي.');
      console.error(err);
    }
  };

  // Render the list view
  const renderListView = () => (
    <>
      <div className="modal-actions">
        <h3>مكتبة البرومبتات</h3>
        <button className="button-primary" onClick={handleAddNew}>
          <FaPlus /> إضافة برومبت جديد
        </button>
      </div>
      {error && <p className="status-message error">{error}</p>}
      <ul className="prompt-list">
        {prompts.map(prompt => (
          <li key={prompt.id} className="prompt-item">
            <span className="prompt-title">{prompt.title}</span>
            <div className="prompt-actions">
              <button onClick={() => handleSetDefault(prompt.id)} title="تعيين كافتراضي">
                {defaultPromptId === prompt.id ? <FaStar color="#ffc107" /> : <FaRegStar />}
              </button>
              <button onClick={() => handleEdit(prompt)} title="تعديل"><FaEdit /></button>
              <button onClick={() => handleDelete(prompt.id)} title="حذف"><FaTrash /></button>
            </div>
          </li>
        ))}
      </ul>
      {prompts.length === 0 && !isLoading && <p>لا توجد برومبتات محفوظة. قم بإضافة واحد جديد.</p>}
    </>
  );

  // This is a sub-component for the form view
  const PromptForm = ({ existingPrompt, onFormSubmit }) => {
    const [title, setTitle] = useState(existingPrompt ? existingPrompt.title : '');
    const [content, setContent] = useState(existingPrompt ? existingPrompt.content : '');
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e) => {
      e.preventDefault();
      setIsSaving(true);
      setError('');
      try {
        const promptData = { title, content };
        if (existingPrompt) {
          await updatePrompt(existingPrompt.id, promptData);
        } else {
          await createPrompt(promptData);
        }
        onFormSubmit(); // This will trigger a refresh and view switch
      } catch (err) {
        setError('فشل في حفظ البرومبت.');
        console.error(err);
        setIsSaving(false);
      }
    };

    return (
      <form onSubmit={handleSubmit}>
        <h3>{existingPrompt ? 'تعديل البرومبت' : 'إضافة برومبت جديد'}</h3>
        <div className="form-group">
          <label htmlFor="prompt-title">عنوان البرومبت</label>
          <input
            id="prompt-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="form-input"
            placeholder="مثال: مترجم قانوني"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="prompt-content">محتوى البرومبت</label>
          <textarea
            id="prompt-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="form-input"
            rows={8}
            placeholder="مثال: أنت مترجم قانوني محترف. مهمتك هي ترجمة النصوص التالية بأسلوب دقيق ورسمي..."
            required
          />
        </div>
        {error && <p className="status-message error">{error}</p>}
        <div className="form-actions">
          <button type="button" className="button-secondary" onClick={() => setView('list')}>إلغاء</button>
          <button type="submit" className="button-primary" disabled={isSaving}>
            {isSaving ? 'جاري الحفظ...' : 'حفظ'}
          </button>
        </div>
      </form>
    );
  };
  
  return (
    <div className="modal-overlay">
      <div className="modal-content wide">
        <div className="modal-header">
          <h2>إدارة البرومبتات</h2>
          <button className="modal-close-button" onClick={closeModal}>
            <FaTimes />
          </button>
        </div>
        {isLoading ? <p>جاري التحميل...</p> : (
            view === 'list' ? renderListView() : <PromptForm existingPrompt={editingPrompt} onFormSubmit={() => { setView('list'); fetchData(); }} />
        )}
      </div>
    </div>
  );
}

export default PromptManagerModal;