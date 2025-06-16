import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { FaComments, FaCog, FaQuestionCircle, FaLanguage, FaSignInAlt, FaUserPlus, FaSignOutAlt, FaKey } from 'react-icons/fa'; // NEW ICONS
import { useAuth } from '../components/AuthContext'; // NEW IMPORT
import { useNavigate } from 'react-router-dom'; // NEW IMPORT
import './Layout.scss';

const Layout = () => {
  const { isAuthenticated, logout } = useAuth(); // NEW: Access auth state and logout function
  const navigate = useNavigate(); // NEW: For programmatic navigation

  const handleLogout = () => {
    logout();
    navigate('/login'); // Redirect to login page after logout
  };

  return (
    <div className="app-layout">
      {/* Sidebar for Desktop */}
      <nav className="sidebar">
        <div className="sidebar-header">
          <div className="logo-container">
            <div className="logo-icon-wrapper">
              <FaLanguage />
            </div>
            <h3>المترجم الذكي</h3>
          </div>
        </div>
        <ul className="sidebar-nav">
          <li>
            <NavLink to="/" end>
              <FaComments />
              <span>المحادثات</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/settings">
              <FaCog />
              <span>الإعدادات</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/help">
              <FaQuestionCircle />
              <span>المساعدة</span>
            </NavLink>
          </li>
          {/* NEW: Auth Links for Desktop Sidebar */}
          {!isAuthenticated ? (
            <>
              <li>
                <NavLink to="/login">
                  <FaSignInAlt />
                  <span>تسجيل الدخول</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/register">
                  <FaUserPlus />
                  <span>إنشاء حساب</span>
                </NavLink>
              </li>
            </>
          ) : (
            <>
              <li>
                <NavLink to="/change-password">
                  <FaKey />
                  <span>تغيير كلمة المرور</span>
                </NavLink>
              </li>
              <li>
                {/* Using a button inside <li> for logout action */}
                <button onClick={handleLogout} className="sidebar-nav-button">
                  <FaSignOutAlt />
                  <span>تسجيل الخروج</span>
                </button>
              </li>
            </>
          )}
        </ul>
      </nav>

      {/* The old mobile-header component has been DELETED from here */}

      {/* Main Content Area */}
      <main className="main-content">
        <Outlet />
      </main>

      {/* Bottom Nav for Mobile */}
      <nav className="bottom-nav">
        <NavLink to="/" end>
          <FaComments />
          <span>المحادثات</span>
        </NavLink>
        <NavLink to="/settings">
          <FaCog />
          <span>الإعدادات</span>
        </NavLink>
        {/* NEW: Auth Links for Mobile Bottom Nav */}
        {!isAuthenticated ? (
          <>
            <NavLink to="/login">
              <FaSignInAlt />
              <span>دخول</span>
            </NavLink>
            <NavLink to="/register">
              <FaUserPlus />
              <span>حساب</span>
            </NavLink>
          </>
        ) : (
          <>
            {/* For mobile, maybe just a password change or logout option in a simplified way */}
            <NavLink to="/change-password">
              <FaKey />
              <span>المرور</span> {/* Simplified text for small screens */}
            </NavLink>
            <button onClick={handleLogout} className="bottom-nav-button">
              <FaSignOutAlt />
              <span>خروج</span>
            </button>
          </>
        )}
        <NavLink to="/help">
          <FaQuestionCircle />
          <span>المساعدة</span>
        </NavLink>
      </nav>
    </div>
  );
};

export default Layout;