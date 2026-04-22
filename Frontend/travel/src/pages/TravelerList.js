import React, { useState, useEffect } from "react";
import TravelerHeader from "../Components/TravelerHeader";
import TravelerFilter from "../Components/TravelerFilter";
import TravelerTable from "../Components/TravelerTable";
import AddTravelerForm from "../Components/AddTravelerForm";
import "../STYLES/traveller.css";
import { getItem, setItem } from "../utils/memoryStorage";
 
const STORAGE_KEY = "my_traveler_data";
 
const TravelerList = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState({ id: "", name: "", email: "", phone: "" });
  const [filteredData, setFilteredData] = useState([]);
 
  const [travelerData, setTravelerData] = useState(() => {
    const saved = getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });
 
  useEffect(() => {
    setItem(STORAGE_KEY, JSON.stringify(travelerData));
  }, [travelerData]);
 
  const handleAddTraveler = (data) => {
    const newTraveler = {
      id: Date.now(),
      name: `${data.title} ${data.firstName} ${data.lastName}`,
      email: data.email,
      mobile: data.phone,
      gender: data.gender,
      age: new Date().getFullYear() - new Date(data.dob).getFullYear(),
    };
    setTravelerData((prev) => [...prev, newTraveler]);
    setShowAddForm(false);
  };
 
  const handleUpdateTraveler = (id, updatedRow) => {
    setTravelerData((prev) => prev.map((item) => item.id === id ? updatedRow : item));
  };
 
  const handleDeleteTraveler = (id) => {
    if (!window.confirm("Delete this traveler?")) return;
    setTravelerData((prev) => prev.filter((item) => item.id !== id));
  };
 
  const handleSearch = () => {
    const result = travelerData.filter((item) => {
      if (filters.name && !item.name.toLowerCase().includes(filters.name.toLowerCase())) return false;
      if (filters.email && !item.email.toLowerCase().includes(filters.email.toLowerCase())) return false;
      if (filters.phone && !item.mobile.includes(filters.phone)) return false;
      return true;
    });
    setFilteredData(result);
  };
 
  const handleClear = () => {
    setFilters({ id: "", name: "", email: "", phone: "" });
    setFilteredData([]);
  };
 
  const displayData = filteredData.length > 0 || (filters.name || filters.email || filters.phone) ? filteredData : travelerData;
 
  return (
    <div className="traveller-container">
      {!showAddForm ? (
        <>
          <TravelerHeader onAdd={() => setShowAddForm(true)} onFilter={() => setShowFilter(!showFilter)} />
          {showFilter && <TravelerFilter filters={filters} setFilters={setFilters} onSearch={handleSearch} onClear={handleClear} />}
          <TravelerTable data={displayData} onUpdate={handleUpdateTraveler} onDelete={handleDeleteTraveler} />
        </>
      ) : (
        <AddTravelerForm onBack={() => setShowAddForm(false)} onSubmit={handleAddTraveler} />
      )}
    </div>
  );
};
 
export default TravelerList;
 
