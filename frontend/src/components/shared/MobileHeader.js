import React from 'react';
import { FaLanguage } from 'react-icons/fa';
import './MobileHeader.scss';

const MobileHeader = ({ title }) => {
  return (
    <header className="mobile-header">
      <div className="logo-container">
        <div className="logo-icon-wrapper">
          <FaLanguage />
        </div>
        <h3>{title}</h3>
      </div>
    </header>
  );
};

export default MobileHeader;