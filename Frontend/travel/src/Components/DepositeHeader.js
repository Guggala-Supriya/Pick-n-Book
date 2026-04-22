import React from "react";
import "../STYLES/deposite.css";

const Header = ({ onFilter, onForm }) => {
  return (
    <div className="deposit-header">
      <h2 className="deposit-page-title">
        <span>Deposit</span> Request List
      </h2>
      <div className="deposit-header-actions">
        <button onClick={onFilter} className="deposit-btn deposit-btn-secondary">
          Filter
        </button>
        <button onClick={onForm} className="deposit-btn deposit-btn-primary">
          Deposit Request
        </button>
      </div>
    </div>
  );
};

export default Header;
