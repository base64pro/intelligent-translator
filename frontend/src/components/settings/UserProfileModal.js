import React, { useState, useEffect } from 'react';
import { getUserProfile, updateUserProfile } from '../../apiClient';
import { FaTimes } from 'react-icons/fa';

function UserProfileModal({ closeModal }) {
  const [profile, setProfile] = useState({ full_name: '', phone_number: '', email: '', work_address: '' });
  const [saveMessage, setProfileSaveMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await getUserProfile();
        if (response.data) {
          setProfile(response.data);
        }
      } catch (err) {
        console.error("Failed to fetch profile", err);
        setError("فشل في تحميل الملف الشخصي.");
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setProfileSaveMessage('');
    setError('');
    try {
      await updateUserProfile(profile);
      setProfileSaveMessage('تم حفظ بيانات الملف الشخصي بنجاح!');
      setTimeout(() => {
        closeModal();
      }, 1500);
    } catch (err) {
      setError('فشل حفظ البيانات.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>الملف الشخصي</h2>
          <button className="modal-close-button" onClick={closeModal}>
            <FaTimes />
          </button>
        </div>
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label htmlFor="full_name">الاسم الكامل</label>
            <input id="full_name" name="full_name" type="text" value={profile.full_name || ''} onChange={handleChange} className="form-input" />
          </div>
          <div className="form-group">
            <label htmlFor="email">البريد الإلكتروني</label>
            <input id="email" name="email" type="email" value={profile.email || ''} onChange={handleChange} className="form-input" />
          </div>
          <div className="form-group">
            <label htmlFor="phone_number">رقم الهاتف</label>
            <input id="phone_number" name="phone_number" type="tel" value={profile.phone_number || ''} onChange={handleChange} className="form-input" />
          </div>
          <div className="form-group">
            <label htmlFor="work_address">عنوان العمل</label>
            <textarea id="work_address" name="work_address" value={profile.work_address || ''} onChange={handleChange} className="form-input" rows={3}></textarea>
          </div>
          <button type="submit" className="button-primary" disabled={isLoading}>
            {isLoading ? "جاري الحفظ..." : "حفظ البيانات"}
          </button>
          {saveMessage && <p className="status-message" style={{ color: 'green' }}>{saveMessage}</p>}
          {error && <p className="status-message error">{error}</p>}
        </form>
      </div>
    </div>
  );
}

export default UserProfileModal;