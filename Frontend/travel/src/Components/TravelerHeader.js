import React from "react";
import "../STYLES/traveller.css";

const TravelerHeader = ({ onAdd, onFilter }) => {
  return (
    <div className="flex-between">
      <h2 className="title-text">Traveler List</h2>
      <div className="header-actions">
        <button onClick={onFilter} className="btn btn-gray" type="button">
          Filter
        </button>
        <button onClick={onAdd} className="btn btn-blue" type="button">
          + Add Traveler
        </button>
      </div>
    </div>
  );
};

export default TravelerHeader;
