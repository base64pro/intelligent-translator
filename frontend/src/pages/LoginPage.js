import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser } from '../apiClient';
import { useAuth } from '../components/AuthContext';
import '../assets/styles/pages/_auth.scss';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const data = await loginUser(username, password);
            login(data.access_token);
            navigate('/');
        } catch (err) {
            console.error('Login failed:', err);
            setError('فشل تسجيل الدخول. تأكد من اسم المستخدم وكلمة المرور.');
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>تسجيل الدخول</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="username">اسم المستخدم:</label>
                        <div className="input-wrapper">
                            <input
                                type="text"
                                id="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                autoComplete="username"
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">كلمة المرور:</label>
                        <div className="input-wrapper password-group">
                            <input
                                type={showPassword ? "text" : "password"}
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoComplete="current-password"
                            />
                            <span
                                className="password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <FaEyeSlash /> : <FaEye />}
                            </span>
                        </div>
                    </div>
                    {error && <p className="error-message">{error}</p>}
                    <button type="submit" className="primary-button">تسجيل الدخول</button>
                </form>
                <p className="auth-footer">
                    ليس لديك حساب؟ <Link to="/register">إنشاء حساب جديد</Link>
                </p>
            </div>
        </div>
    );
};

export default LoginPage;