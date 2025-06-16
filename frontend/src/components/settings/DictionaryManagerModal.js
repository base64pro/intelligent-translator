import React, { useState, useEffect } from 'react';
import { FaTimes, FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import { getDictionaryEntries, createDictionaryEntry, updateDictionaryEntry, deleteDictionaryEntry } from '../../apiClient';

function DictionaryManagerModal({ closeModal }) {
  const [entries, setEntries] = useState([]);
  const [view, setView] = useState('list');
  const [editingEntry, setEditingEntry] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await getDictionaryEntries();
      setEntries(response.data);
    } catch (err) {
      setError('فشل في تحميل مدخلات القاموس.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddNew = () => {
    setEditingEntry(null);
    setView('form');
  };

  const handleEdit = (entry) => {
    setEditingEntry(entry);
    setView('form');
  };

  const handleDelete = async (entryId) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المدخل؟')) {
      try {
        await deleteDictionaryEntry(entryId);
        fetchData(); // Refresh the list
      } catch (err) {
        setError('فشل في حذف المدخل.');
        console.error(err);
      }
    }
  };

  const EntryForm = ({ existingEntry, onFormSubmit }) => {
    const [sourceText, setSourceText] = useState(existingEntry ? existingEntry.source_text : '');
    const [targetText, setTargetText] = useState(existingEntry ? existingEntry.target_text : '');
    const [isSaving, setIsSaving] = useState(false);
    const [formError, setFormError] = useState('');

    const handleSubmit = async (e) => {
      e.preventDefault();
      setFormError('');
      if (!sourceText.trim() || !targetText.trim()) {
        setFormError('يجب ملء كلا الحقلين.');
        return;
      }
      setIsSaving(true);
      try {
        const entryData = { source_text: sourceText, target_text: targetText };
        if (existingEntry) {
          await updateDictionaryEntry(existingEntry.id, entryData);
        } else {
          await createDictionaryEntry(entryData);
        }
        onFormSubmit();
      } catch (err) {
        setFormError(err.response?.data?.detail || 'فشل في حفظ المدخل.');
        console.error(err);
        setIsSaving(false);
      }
    };

    return (
      <form onSubmit={handleSubmit}>
        <h3>{existingEntry ? 'تعديل مدخل' : 'إضافة مدخل جديد'}</h3>
        <div className="form-group">
          <label htmlFor="source-text">النص المصدر</label>
          <input
            id="source-text"
            type="text"
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            className="form-input"
            placeholder="مثال: Intelligent Translator"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="target-text">الترجمة الهدف</label>
          <input
            id="target-text"
            type="text"
            value={targetText}
            onChange={(e) => setTargetText(e.target.value)}
            className="form-input"
            placeholder="مثال: المترجم الذكي"
            required
          />
        </div>
        {formError && <p className="status-message error">{formError}</p>}
        <div className="form-actions">
          <button type="button" className="button-secondary" onClick={() => setView('list')}>إلغاء</button>
          <button type="submit" className="button-primary" disabled={isSaving}>
            {isSaving ? 'جاري الحفظ...' : 'حفظ'}
          </button>
        </div>
      </form>
    );
  };

  const renderListView = () => (
    <>
      <div className="modal-actions">
        <h3>القاموس المخصص</h3>
        <button className="button-primary" onClick={handleAddNew}>
          <FaPlus /> إضافة مدخل جديد
        </button>
      </div>
      {error && <p className="status-message error">{error}</p>}
      <div className="prompt-list"> {/* Reusing prompt-list style for consistency */}
        <table>
          <thead>
            <tr>
              <th>النص المصدر</th>
              <th>الترجمة الهدف</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(entry => (
              <tr key={entry.id} className="prompt-item">
                <td>{entry.source_text}</td>
                <td>{entry.target_text}</td>
                <td>
                  <div className="prompt-actions">
                    <button onClick={() => handleEdit(entry)} title="تعديل"><FaEdit /></button>
                    <button onClick={() => handleDelete(entry.id)} title="حذف"><FaTrash /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {entries.length === 0 && !isLoading && <p>القاموس فارغ. قم بإضافة مدخل جديد.</p>}
    </>
  );

  return (
    <div className="modal-overlay">
      <div className="modal-content wide">
        <div className="modal-header">
          <h2>إدارة القاموس المخصص</h2>
          <button className="modal-close-button" onClick={closeModal}>
            <FaTimes />
          </button>
        </div>
        {isLoading ? <p>جاري التحميل...</p> : (
            view === 'list' ? renderListView() : <EntryForm existingEntry={editingEntry} onFormSubmit={() => { setView('list'); fetchData(); }} />
        )}
      </div>
    </div>
  );
}

export default DictionaryManagerModal;