import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { changePassword } from '../apiClient';
import { useAuth } from '../components/AuthContext';
import '../assets/styles/pages/_auth.scss';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const ChangePasswordPage = () => {
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    if (!isAuthenticated) {
        navigate('/login');
        return null;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        if (newPassword !== confirmNewPassword) {
            setError('كلمة المرور الجديدة وتأكيدها غير متطابقتين.');
            return;
        }

        if (newPassword.length < 6) {
            setError('يجب أن تكون كلمة المرور الجديدة 6 أحرف على الأقل.');
            return;
        }

        try {
            await changePassword(oldPassword, newPassword);
            setSuccessMessage('تم تغيير كلمة المرور بنجاح!');
            setTimeout(() => {
                navigate('/');
            }, 2000);
        } catch (err) {
            const errorDetail = err.response?.data?.detail || 'فشل تغيير كلمة المرور. الرجاء المحاولة لاحقاً.';
            setError(errorDetail);
            console.error('Password change failed:', err);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>تغيير كلمة المرور</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="oldPassword">كلمة المرور القديمة:</label>
                        <div className="input-wrapper password-group">
                            <input
                                type={showOldPassword ? "text" : "password"}
                                id="oldPassword"
                                value={oldPassword}
                                onChange={(e) => setOldPassword(e.target.value)}
                                required
                            />
                            <span
                                className="password-toggle"
                                onClick={() => setShowOldPassword(!showOldPassword)}
                            >
                                {showOldPassword ? <FaEyeSlash /> : <FaEye />}
                            </span>
                        </div>
                    </div>
                    <div className="form-group">
                        <label htmlFor="newPassword">كلمة المرور الجديدة:</label>
                        <div className="input-wrapper password-group">
                            <input
                                type={showNewPassword ? "text" : "password"}
                                id="newPassword"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                            />
                            <span
                                className="password-toggle"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                            >
                                {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                            </span>
                        </div>
                    </div>
                    <div className="form-group">
                        <label htmlFor="confirmNewPassword">تأكيد كلمة المرور الجديدة:</label>
                        <div className="input-wrapper password-group">
                            <input
                                type={showConfirmNewPassword ? "text" : "password"}
                                id="confirmNewPassword"
                                value={confirmNewPassword}
                                onChange={(e) => setConfirmNewPassword(e.target.value)}
                                required
                            />
                            <span
                                className="password-toggle"
                                onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                            >
                                {showConfirmNewPassword ? <FaEyeSlash /> : <FaEye />}
                            </span>
                        </div>
                    </div>
                    {error && <p className="error-message">{error}</p>}
                    {successMessage && <p className="success-message">{successMessage}</p>}
                    <button type="submit" className="primary-button">تغيير كلمة المرور</button>
                </form>
                <p className="auth-footer">
                    <Link to="/">العودة إلى الصفحة الرئيسية</Link>
                </p>
            </div>
        </div>
    );
};

export default ChangePasswordPage;