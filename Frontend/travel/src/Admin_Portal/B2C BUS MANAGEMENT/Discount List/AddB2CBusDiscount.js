import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './AddB2CBusDiscount.css';
import { getItem, setItem } from '../../../utils/memoryStorage';

const initialRows = [
  {
    id: 'DSC-0285',
    value: 300,
    type: 'Fixed',
    entryDate: '13 Mar 2026, 12:36 PM',
    updateDate: '13 Mar 2026, 12:36 PM',
    updatedBy: 'Pick N Book',
    remark: 'New season launch price',
    status: 'Active',
  },
  {
    id: 'DSC-0286',
    value: 150,
    type: 'Fixed',
    entryDate: '14 Mar 2026, 09:05 AM',
    updateDate: '14 Mar 2026, 10:42 AM',
    updatedBy: 'Admin Team',
    remark: 'Morning commuter offer',
    status: 'Active',
  },
  {
    id: 'DSC-0287',
    value: 12,
    type: 'Percentage',
    entryDate: '14 Mar 2026, 02:20 PM',
    updateDate: '14 Mar 2026, 05:11 PM',
    updatedBy: 'Revenue Desk',
    remark: 'Weekend leisure discount',
    status: 'Inactive',
  },
  {
    id: 'DSC-0288',
    value: 200,
    type: 'Fixed',
    entryDate: '15 Mar 2026, 08:15 AM',
    updateDate: '15 Mar 2026, 08:15 AM',
    updatedBy: 'Pick N Book',
    remark: 'Limited route boost',
    status: 'Active',
  },
  {
    id: 'DSC-0289',
    value: 8,
    type: 'Percentage',
    entryDate: '15 Mar 2026, 11:48 AM',
    updateDate: '15 Mar 2026, 01:30 PM',
    updatedBy: 'Operations',
    remark: 'Student community promo',
    status: 'Active',
  },
  {
    id: 'DSC-0290',
    value: 250,
    type: 'Fixed',
    entryDate: '16 Mar 2026, 10:22 AM',
    updateDate: '16 Mar 2026, 10:22 AM',
    updatedBy: 'Pick N Book',
    remark: 'Off-peak capacity fill',
    status: 'Inactive',
  },
];

const STORAGE_KEY = 'admin_b2c_bus_discounts';

const formatDate = (date) =>
  date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

const getStoredRows = () => {
  try {
    const raw = getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    return null;
  }

  return null;
};

function AddB2CBusDiscount() {
  const navigate = useNavigate();
  const location = useLocation();
  const editingRow = useMemo(() => location.state?.row || null, [location.state]);

  const [formType, setFormType] = useState(editingRow?.type || 'Percentage');
  const [formValue, setFormValue] = useState(editingRow ? String(editingRow.value) : '');
  const [formRemark, setFormRemark] = useState(editingRow?.remark || '');
  const [error, setError] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    setError('');

    if (!formValue) {
      setError('Value is required.');
      return;
    }

    const existingRows = getStoredRows() || initialRows;
    const now = new Date();
    const formattedDate = formatDate(now);

    let updatedRows = existingRows;

    if (editingRow) {
      updatedRows = existingRows.map((row) => {
        if (row.id !== editingRow.id) {
          return row;
        }

        return {
          ...row,
          type: formType,
          value: Number(formValue),
          remark: formRemark || row.remark,
          updateDate: formattedDate,
          updatedBy: 'Pick N Book',
        };
      });
    } else {
      const nextNumber = existingRows.length
        ? Number.parseInt(existingRows[existingRows.length - 1].id.split('-')[1], 10) + 1
        : 285;

      const newRow = {
        id: `DSC-${String(nextNumber).padStart(4, '0')}`,
        value: Number(formValue),
        type: formType,
        entryDate: formattedDate,
        updateDate: formattedDate,
        updatedBy: 'Pick N Book',
        remark: formRemark || 'New bus discount',
        status: 'Active',
      };

      updatedRows = [newRow, ...existingRows];
    }

    setItem(STORAGE_KEY, JSON.stringify(updatedRows));
    navigate('/admin/b2c-bus/discounts');
  };

  const handleReset = () => {
    setFormType(editingRow?.type || 'Percentage');
    setFormValue(editingRow ? String(editingRow.value) : '');
    setFormRemark(editingRow?.remark || '');
    setError('');
  };

  return (
    <section className="add-discount-page">
      <header className="add-discount-header">
        <div>
          <p className="add-discount-title">Add B2C Bus Discount</p>
          <p className="add-discount-subtitle">Configure discount value and remark details.</p>
        </div>
        <button type="button" className="ghost-btn" onClick={() => navigate('/admin/b2c-bus/discounts')}>
          B2C Bus Discount List
        </button>
      </header>

      <form className="add-discount-form" onSubmit={handleSubmit}>
        <label className="add-field">
          <span>Discount Type</span>
          <select
            value={formType}
            onChange={(event) => setFormType(event.target.value)}
          >
            <option value="Percentage">Percentage</option>
            <option value="Fixed">Fixed</option>
          </select>
        </label>

        <label className="add-field">
          <span>Value</span>
          <input
            type="number"
            min="0"
            placeholder="0"
            value={formValue}
            onChange={(event) => setFormValue(event.target.value)}
          />
        </label>

        <label className="add-field add-field-wide">
          <span>Remark</span>
          <input
            type="text"
            placeholder="Remark"
            value={formRemark}
            onChange={(event) => setFormRemark(event.target.value)}
          />
        </label>

        {error ? <p className="form-error">{error}</p> : null}

        <div className="form-actions">
          <button type="submit" className="primary-btn">
            Submit
          </button>
          <button type="button" className="ghost-btn" onClick={handleReset}>
            Reset
          </button>
        </div>
      </form>
    </section>
  );
}

export default AddB2CBusDiscount;
