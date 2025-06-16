import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  getConversations, 
  createConversation, 
  deleteConversation, 
  renameConversation,
  getArchivedConversations,
  archiveConversation
} from '../apiClient';
import { FaEdit, FaTrash, FaArchive, FaInbox } from 'react-icons/fa';
import MobileHeader from '../components/shared/MobileHeader';
import './ConversationListPage.scss';

const formatDate = (dateString) => {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

function ConversationListPage() {
  const [conversations, setConversations] = useState([]);
  const [newConversationTitle, setNewConversationTitle] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [viewMode, setViewMode] = useState('active');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setIsLoading(true);
        const response = viewMode === 'active' 
          ? await getConversations() 
          : await getArchivedConversations();
        setConversations(response.data);
        setError('');
      } catch (err) {
        setError(`فشل في جلب المحادثات ال${viewMode === 'active' ? 'نشطة' : 'مؤرشفة'}.`);
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchConversations();
  }, [viewMode]);

  const filteredConversations = useMemo(() => {
    if (!searchQuery) {
      return conversations;
    }
    return conversations.filter(convo =>
      convo.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [conversations, searchQuery]);

  const handleCreateConversation = async (e) => { e.preventDefault(); if (!newConversationTitle.trim()) return; try { const response = await createConversation(newConversationTitle); navigate(`/conversation/${response.data.id}`); } catch (err) { setError('فشل في إنشاء المحادثة.'); console.error(err); } };
  const handleDelete = async (id, title) => { if (window.confirm(`هل أنت متأكد من رغبتك في حذف محادثة "${title}"؟ هذا الإجراء لا يمكن التراجع عنه.`)) { try { await deleteConversation(id); setConversations(conversations.filter(convo => convo.id !== id)); } catch (err) { setError('فشل في حذف المحادثة.'); console.error(err); } } };
  const handleStartEditing = (convo) => { setEditingId(convo.id); setEditingTitle(convo.title); };
  const handleCancelEditing = () => { setEditingId(null); setEditingTitle(''); };
  const handleSaveRename = async (id) => { if (!editingTitle.trim()) return; try { await renameConversation(id, editingTitle); setConversations(conversations.map(convo => convo.id === id ? { ...convo, title: editingTitle } : convo)); handleCancelEditing(); } catch (err) { setError('فشل في إعادة تسمية المحادثة.'); console.error(err); } };
  const handleRenameKeyDown = (e, id) => { if (e.key === 'Enter') handleSaveRename(id); else if (e.key === 'Escape') handleCancelEditing(); };
  const handleArchiveToggle = async (id, newStatus) => { try { await archiveConversation(id, newStatus); setConversations(conversations.filter(convo => convo.id !== id)); } catch (err) { setError(`فشل في ${newStatus ? 'أرشفة' : 'إلغاء أرشفة'} المحادثة.`); console.error(err); } };

  return (
    <div className="page-container conversation-page-container">
      <MobileHeader title="المترجم الذكي" />
      <div className="page-header"> <h1>المحادثات</h1> <div className="view-toggle-buttons"> <button onClick={() => setViewMode('active')} className={viewMode === 'active' ? 'active' : ''}> النشطة </button> <button onClick={() => setViewMode('archived')} className={viewMode === 'archived' ? 'active' : ''}> الأرشيف </button> </div> </div>
      <div className="card actions-container"> <form onSubmit={handleCreateConversation} className="new-conversation-form"> <input type="text" value={newConversationTitle} onChange={(e) => setNewConversationTitle(e.target.value)} placeholder="ابدأ محادثة جديدة..." className="form-input" /> <button type="submit" onClick={handleCreateConversation} className="button-primary">إنشاء</button> </form> <div className="search-container"> <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="ابحث في عناوين المحادثات..." className="search-input" /> </div> </div>
      <div className="card list-card">
        {isLoading ? ( <p>جاري تحميل المحادثات...</p> ) : (
          <ul className="conversation-list">
            {filteredConversations.length > 0 ? (
              filteredConversations.map((convo) => (
                <li key={convo.id} className="conversation-item">
                  {editingId === convo.id ? ( <input type="text" value={editingTitle} onChange={(e) => setEditingTitle(e.target.value)} onBlur={() => handleSaveRename(convo.id)} onKeyDown={(e) => handleRenameKeyDown(e, convo.id)} className="rename-input" autoFocus /> ) : (
                    <>
                      <Link to={`/conversation/${convo.id}`} className="conversation-link">
                        <span className="conversation-title-text">{convo.title}</span>
                        <span className="conversation-date">
                          {formatDate(convo.created_at)}
                        </span>
                      </Link>
                      <div className="conversation-actions">
                        <button onClick={() => handleArchiveToggle(convo.id, viewMode === 'active')} title={viewMode === 'active' ? 'أرشفة' : 'إلغاء الأرشفة'}>
                          {viewMode === 'active' ? <FaArchive /> : <FaInbox />}
                        </button>
                        <button onClick={() => handleStartEditing(convo)} title="إعادة التسمية">
                          <FaEdit />
                        </button>
                        <button onClick={() => handleDelete(convo.id, convo.title)} title="حذف">
                          <FaTrash />
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))
            ) : ( <p className="no-conversations"> {searchQuery ? 'لا توجد نتائج تطابق بحثك.' : (viewMode === 'active' ? 'لا توجد محادثات نشطة.' : 'لا توجد محادثات في الأرشيف.')} </p> )}
          </ul>
        )}
      </div>
    </div>
  );
}

export default ConversationListPage;