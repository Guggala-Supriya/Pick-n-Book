import React, { useState } from "react";
import Header from "../Components/DepositeHeader";
import FilterPanel from "../Components/DepositFilter";
import DepositTable from "../Components/DepositeTable";
import DepositForm from "../Components/DepositForm";
import "../STYLES/deposite.css";

const DepositRequestList = () => {
  const [showForm, setShowForm] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [transactionDate, setTransactionDate] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [depositData, setDepositData] = useState([
    { id: 1, entryDate: "2026-01-10", transactionDate: "2026-01-10", amount: "5000", type: "UPI Transfer", status: "Approved", userRemark: "Payment done", adminRemark: "Verified" },
    { id: 2, entryDate: "2026-01-15", transactionDate: "2026-01-15", amount: "12000", type: "Bank Transfer", status: "Pending", userRemark: "Waiting approval", adminRemark: "-" },
  ]);

  const handleSearch = (reset = false) => {
    if (reset) {
      setFromDate("");
      setToDate("");
      setTransactionDate("");
      setFilteredData([]);
      return;
    }

    const result = depositData.filter((item) => {
      const itemDate = new Date(item.transactionDate);
      const from = fromDate ? new Date(fromDate) : null;
      const to = toDate ? new Date(toDate) : null;

      const matchTransactionDate = !transactionDate || item.transactionDate === transactionDate;
      const matchFrom = !from || itemDate >= from;
      const matchTo = !to || itemDate <= to;

      return matchTransactionDate && matchFrom && matchTo;
    });
    setFilteredData(result);
  };

  const handleFormSubmit = (data) => {
    const newData = { id: Date.now(), entryDate: data.entryDate, transactionDate: data.transactionDate, amount: data.amount, type: data.type, status: data.status, userRemark: data.remark, adminRemark: data.adminRemark || "-" };
    setDepositData((prev) => [...prev, newData]);
    setShowForm(false);
  };

  const displayData = filteredData.length > 0 || transactionDate ? filteredData : depositData;

  return (
    <div className="deposit-container">
      {!showForm ? (
        <>
          <Header onFilter={() => setShowFilter(!showFilter)} onForm={() => setShowForm(true)} />
          {showFilter && (
            <FilterPanel
              fromDate={fromDate}
              toDate={toDate}
              transactionDate={transactionDate}
              setFromDate={setFromDate}
              setToDate={setToDate}
              setTransactionDate={setTransactionDate}
              onSearch={handleSearch}
            />
          )}
          <DepositTable data={displayData} onDelete={(id) => setDepositData(depositData.filter(i => i.id !== id))} onUpdateRow={(id, row) => setDepositData(depositData.map(i => i.id === id ? row : i))} />
        </>
      ) : (
        <DepositForm onSubmit={handleFormSubmit} onBack={() => setShowForm(false)} />
      )}
    </div>
  );
};

export default DepositRequestList;
