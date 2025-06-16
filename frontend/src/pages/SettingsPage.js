import React, { useState } from 'react';
import { FaUserCircle, FaKey, FaBook, FaTrash, FaCogs, FaMicrophoneAlt, FaLightbulb } from 'react-icons/fa';
import ApiKeyModal from '../components/settings/ApiKeyModal';
import UserProfileModal from '../components/settings/UserProfileModal';
import ModelSettingsModal from '../components/settings/ModelSettingsModal';
import AudioSettingsModal from '../components/settings/AudioSettingsModal';
import PromptManagerModal from '../components/settings/PromptManagerModal';
import DictionaryManagerModal from '../components/settings/DictionaryManagerModal'; // <-- NEW IMPORT
import './SettingsPage.scss';

function SettingsPage() {
  const [activeModal, setActiveModal] = useState(null);

  const settingsOptions = [
    { key: 'profile', title: 'الملف الشخصي', description: 'تعديل بياناتك الشخصية مثل الاسم والإيميل.', icon: <FaUserCircle /> },
    { key: 'api', title: 'إدارة مفتاح API', description: 'إدخال أو تحديث مفتاح OpenAI API الخاص بك.', icon: <FaKey /> },
    { key: 'prompts', title: 'إدارة البرومبتات', description: 'إنشاء وإدارة مكتبة توجيهات الذكاء الاصطناعي.', icon: <FaLightbulb /> },
    { key: 'dictionary', title: 'القاموس المخصص', description: 'إضافة كلمات وترجمات ثابتة لإجبار المترجم عليها.', icon: <FaBook /> },
    { key: 'models', title: 'إعدادات النماذج', description: 'اختيار نموذج الذكاء الاصطناعي والصوت.', icon: <FaCogs /> },
    { key: 'audio', title: 'إعدادات الصوت', description: 'تحديد لغة الإدخال الصوتي لتحسين الدقة.', icon: <FaMicrophoneAlt /> },
    { key: 'data', title: 'إدارة البيانات', description: 'مسح كل المحادثات أو إعادة ضبط التطبيق (قريباً).', icon: <FaTrash /> },
  ];

  const renderModal = () => {
    switch (activeModal) {
      case 'api':
        return <ApiKeyModal closeModal={() => setActiveModal(null)} />;
      case 'profile':
        return <UserProfileModal closeModal={() => setActiveModal(null)} />;
      case 'models':
        return <ModelSettingsModal closeModal={() => setActiveModal(null)} />;
      case 'audio':
        return <AudioSettingsModal closeModal={() => setActiveModal(null)} />;
      case 'prompts':
        return <PromptManagerModal closeModal={() => setActiveModal(null)} />;
      case 'dictionary': // <-- NEW CASE
        return <DictionaryManagerModal closeModal={() => setActiveModal(null)} />;
      default:
        return null;
    }
  };

  return (
    <div className="page-container">
      <div className="settings-dashboard">
        <div className="page-header">
          <h1>الإعدادات العامة</h1>
        </div>
        <div className="settings-grid">
          {settingsOptions.map((opt) => (
            <div key={opt.key} className="setting-card" onClick={() => setActiveModal(opt.key)}>
              <div className="setting-card-header">
                <div className="setting-card-icon">{opt.icon}</div>
                <h3>{opt.title}</h3>
              </div>
              <p>{opt.description}</p>
            </div>
          ))}
        </div>
      </div>
      
      {renderModal()}
    </div>
  );
}

export default SettingsPage;