import React, { useState, useMemo } from 'react';
import { Search, Download, Filter, ChevronLeft, ChevronRight, CheckCircle2, XCircle } from 'lucide-react';

export default function DataTable({ data }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [completedFilter, setCompletedFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(15);

  const filteredData = useMemo(() => {
    if (!data) return [];

    return data.filter(item => {
      // Search term
      const matchesSearch = item.task_text ? item.task_text.toLowerCase().includes(searchTerm.toLowerCase()) : true;
      // Category
      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
      // Priority
      const matchesPriority = priorityFilter === 'all' || item.priority === priorityFilter;
      // Completed
      const matchesCompleted = completedFilter === 'all' || String(item.completed) === completedFilter;

      return matchesSearch && matchesCategory && matchesPriority && matchesCompleted;
    });
  }, [data, searchTerm, categoryFilter, priorityFilter, completedFilter]);

  // Pagination logic
  const totalPages = Math.ceil(filteredData.length / rowsPerPage) || 1;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedRows = filteredData.slice(startIndex, startIndex + rowsPerPage);

  const handleDownloadCSV = () => {
    if (!data || data.length === 0) return;

    const headers = Object.keys(data[0]).join(',');
    const rows = filteredData.map(row => Object.values(row).join(','));
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'task_dataset_filtered.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="glass-panel animate-fade-in" style={{ padding: '24px', marginBottom: '28px' }}>
      {/* Header & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Dataset Explorer ({filteredData.length} Rows)</h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Inspect raw task history, filter features, and export synthetic datasets.
          </p>
        </div>

        <button onClick={handleDownloadCSV} className="btn-secondary">
          <Download size={16} />
          Export CSV
        </button>
      </div>

      {/* Filter Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="input-field"
            style={{ paddingLeft: '36px' }}
            placeholder="Search task text..."
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          />
        </div>

        {/* Category filter */}
        <select className="select-field" value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setCurrentPage(1); }}>
          <option value="all">All Categories</option>
          <option value="academic">Academic</option>
          <option value="work">Work</option>
          <option value="health">Health</option>
          <option value="personal">Personal</option>
          <option value="learning">Learning</option>
        </select>

        {/* Priority filter */}
        <select className="select-field" value={priorityFilter} onChange={e => { setPriorityFilter(e.target.value); setCurrentPage(1); }}>
          <option value="all">All Priorities</option>
          <option value="low">Low Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="high">High Priority</option>
        </select>

        {/* Status filter */}
        <select className="select-field" value={completedFilter} onChange={e => { setCompletedFilter(e.target.value); setCurrentPage(1); }}>
          <option value="all">All Statuses</option>
          <option value="1">Completed (1)</option>
          <option value="0">Dropped / Incomplete (0)</option>
        </select>
      </div>

      {/* Data Table */}
      <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'rgba(10, 14, 23, 0.8)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <th style={{ padding: '12px 16px' }}>Task Text</th>
              <th style={{ padding: '12px 16px' }}>Category</th>
              <th style={{ padding: '12px 16px' }}>Priority</th>
              <th style={{ padding: '12px 16px' }}>Day</th>
              <th style={{ padding: '12px 16px' }}>Hour Slot</th>
              <th style={{ padding: '12px 16px' }}>Est (m)</th>
              <th style={{ padding: '12px 16px' }}>Act (m)</th>
              <th style={{ padding: '12px 16px' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRows.length > 0 ? (
              paginatedRows.map((row, idx) => {
                const isComp = Number(row.completed) === 1;
                return (
                  <tr
                    key={idx}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>{row.task_text}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className="badge badge-cat">{row.category}</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className={`badge badge-${row.priority}`}>{row.priority}</span>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>
                      {row.day_of_week} {Number(row.is_weekend) === 1 ? '(Wknd)' : ''}
                    </td>
                    <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)' }}>
                      {String(row.hour_slot).padStart(2, '0')}:00
                    </td>
                    <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)' }}>{row.estimated_duration}</td>
                    <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', color: Number(row.actual_duration) > Number(row.estimated_duration) ? '#fbbf24' : '#6ee7b7' }}>
                      {row.actual_duration}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className={`badge ${isComp ? 'badge-completed' : 'badge-failed'}`}>
                        {isComp ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                        {isComp ? 'Completed' : 'Dropped'}
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="8" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No matching tasks found. Try resetting filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        <div>
          Showing {startIndex + 1} - {Math.min(startIndex + rowsPerPage, filteredData.length)} of {filteredData.length} entries
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="btn-secondary"
            style={{ padding: '6px 12px', opacity: currentPage === 1 ? 0.5 : 1 }}
          >
            <ChevronLeft size={16} />
          </button>
          <span style={{ fontFamily: 'var(--font-mono)' }}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="btn-secondary"
            style={{ padding: '6px 12px', opacity: currentPage === totalPages ? 0.5 : 1 }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
