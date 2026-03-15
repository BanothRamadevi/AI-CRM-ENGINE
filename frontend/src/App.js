import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Trash2, Search, Plus, UserCircle, Download, BarChart2, History, X, PieChart as PieIcon, Phone, MapPin, Edit3 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

function App() {
  const [customers, setCustomers] = useState([]);
  const [stats, setStats] = useState({ total: 0, new: 0 });
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false); // NEW: Toggle state
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isChartOpen, setIsChartOpen] = useState(false);
  
  const [selectedLead, setSelectedLead] = useState(null);
  const [noteContent, setNoteContent] = useState("");
  const [formData, setFormData] = useState({ name: '', email: '', company: '', mobile: '', address: '' });

  useEffect(() => { fetchCustomers(); fetchStats(); }, []);

  const fetchCustomers = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/customers');
      setCustomers(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchStats = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/analytics/stats');
      setStats(res.data);
    } catch (err) { console.error(err); }
  };

  const getChartData = () => {
    const statusCounts = customers.reduce((acc, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1;
      return acc;
    }, {});
    return Object.keys(statusCounts).map(status => ({ name: status, value: statusCounts[status] }));
  };

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];

  // FEATURE: Combined Add/Edit logic with Duplicate Handling
  const handleAddOrEdit = async (e) => {
    e.preventDefault();
    try {
      const params = `name=${encodeURIComponent(formData.name)}&email=${encodeURIComponent(formData.email)}&company=${encodeURIComponent(formData.company)}&mobile=${encodeURIComponent(formData.mobile)}&address=${encodeURIComponent(formData.address)}`;
      
      if (isEditMode) {
        await axios.put(`http://127.0.0.1:8000/customers/${selectedLead.id}?${params}`);
      } else {
        await axios.post(`http://127.0.0.1:8000/customers?${params}`);
      }
      
      setIsModalOpen(false);
      setFormData({ name: '', email: '', company: '', mobile: '', address: '' });
      fetchCustomers();
      fetchStats();
    } catch (err) {
      // Handles Duplicate Lead Elimination error from backend
      alert(err.response?.data?.detail || "An error occurred");
    }
  };

  const openAddModal = () => {
    setIsEditMode(false);
    setFormData({ name: '', email: '', company: '', mobile: '', address: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (lead) => {
    setSelectedLead(lead);
    setIsEditMode(true);
    setFormData({ name: lead.name, email: lead.email, company: lead.company, mobile: lead.mobile, address: lead.address });
    setIsModalOpen(true);
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`http://127.0.0.1:8000/customers/${selectedLead.id}/interactions?content=${encodeURIComponent(noteContent)}`);
      setNoteContent("");
      fetchCustomers(); 
      setIsHistoryOpen(false);
    } catch (err) { console.error(err); }
  };

  const toggleStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === "New" ? "Contacted" : "New";
    await axios.put(`http://127.0.0.1:8000/customers/${id}/status?status=${nextStatus}`);
    fetchCustomers();
    fetchStats();
  };

  const handleDelete = async (id) => {
    if(window.confirm("Delete permanently?")) {
      await axios.delete(`http://127.0.0.1:8000/customers/${id}`);
      fetchCustomers();
      fetchStats();
    }
  };

  const exportToCSV = () => {
    const headers = "Name,Email,Mobile,Company,Address,Status,Score\n";
    const rows = customers.map(c => `"${c.name}","${c.email}","${c.mobile}","${c.company}","${c.address}","${c.status}","${c.score}%"`).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CRM_Leads_Final.csv`;
    a.click();
  };

  // KEEPING YOUR FILTERING LOGIC
  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.mobile && c.mobile.includes(searchTerm)) ||
    (c.address && c.address.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
            <div><p className="text-slate-500 text-sm font-bold uppercase tracking-wider">Total Leads</p><h3 className="text-3xl font-black text-indigo-900">{stats.total}</h3></div>
            <BarChart2 className="text-indigo-200" size={48} />
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
            <div><p className="text-slate-500 text-sm font-bold uppercase tracking-wider">New Leads</p><h3 className="text-3xl font-black text-emerald-600">{stats.new}</h3></div>
            <Plus className="text-emerald-200" size={48} />
          </div>
          <button onClick={() => setIsChartOpen(true)} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between hover:bg-indigo-50 transition-colors group">
            <div className="text-left"><p className="text-slate-500 text-sm font-bold uppercase tracking-wider group-hover:text-indigo-600">Insights</p><h3 className="text-2xl font-black text-indigo-900 group-hover:text-indigo-700">Visualization</h3></div>
            <PieIcon className="text-indigo-400 group-hover:rotate-12 transition-transform" size={48} />
          </button>
        </div>

        <header className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
          <h1 className="text-4xl font-black text-indigo-900 tracking-tight">CRM Engine</h1>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <button onClick={exportToCSV} className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-sm"><Download size={20}/></button>
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-3 text-slate-400" size={18} />
              <input type="text" placeholder="Search leads..." className="pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl w-full" onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <button onClick={openAddModal} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-indigo-700 shadow-lg">+ Add Lead</button>
          </div>
        </header>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs uppercase font-bold tracking-wider">
              <tr><th className="px-8 py-5">Contact</th><th className="px-8 py-5 text-center">Score</th><th className="px-8 py-5">Organization</th><th className="px-8 py-5">Status</th><th className="px-8 py-5 text-right">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.map(c => (
                <tr key={c.id} className="hover:bg-indigo-50/30 group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3"><UserCircle className="text-slate-300" size={32} /><div><div className="font-bold text-slate-800">{c.name}</div><div className="text-xs text-slate-400">{c.email} • {c.mobile}</div></div></div>
                  </td>
                  {/* KEEPING HOT LEAD LOGIC */}
                  <td className="px-8 py-5 text-center"><span className={`text-xs font-bold ${c.score === 100 ? 'text-orange-500 animate-pulse' : 'text-slate-400'}`}>{c.score === 100 ? '🔥 HOT' : `${c.score}%`}</span></td>
                  <td className="px-8 py-5 text-slate-600 font-medium">{c.company}</td>
                  <td className="px-8 py-5"><button onClick={() => toggleStatus(c.id, c.status)} className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${c.status === 'New' ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'}`}>{c.status}</button></td>
                  <td className="px-8 py-5 text-right flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEditModal(c)} className="text-indigo-400 hover:text-indigo-600"><Edit3 size={20}/></button>
                    <button onClick={() => { setSelectedLead(c); setIsHistoryOpen(true); }} className="text-indigo-400 hover:text-indigo-600"><History size={20} /></button>
                    <button onClick={() => handleDelete(c.id)} className="text-slate-300 hover:text-red-600"><Trash2 size={20} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Visualization (KEPT UNCHANGED) */}
      {isChartOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-3xl w-full max-w-2xl shadow-2xl">
            <div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-black text-indigo-900">Pipeline Visualization</h2><button onClick={() => setIsChartOpen(false)}><X/></button></div>
            <div className="h-80 w-full"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={getChartData()} innerRadius={80} outerRadius={100} paddingAngle={5} dataKey="value">{getChartData().map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer></div>
          </div>
        </div>
      )}

      {/* MODAL: Add/Edit Combined */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleAddOrEdit} className="bg-white p-10 rounded-3xl w-full max-w-md shadow-2xl border border-white">
            <h2 className="text-3xl font-black text-slate-800 mb-6">{isEditMode ? "Edit Lead" : "New Lead"}</h2>
            <div className="space-y-4">
              <input placeholder="Name" className="w-full p-4 bg-slate-50 border rounded-2xl outline-indigo-500" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
              <input placeholder="Email" type="email" className="w-full p-4 bg-slate-50 border rounded-2xl outline-indigo-500" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
              <input placeholder="Mobile" className="w-full p-4 bg-slate-50 border rounded-2xl outline-indigo-500" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} required />
              <input placeholder="Company" className="w-full p-4 bg-slate-50 border rounded-2xl outline-indigo-500" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} required />
              <input placeholder="Address" className="w-full p-4 bg-slate-50 border rounded-2xl outline-indigo-500" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} required />
            </div>
            <div className="flex gap-4 mt-10">
              <button type="submit" className="flex-1 bg-indigo-600 text-white py-3 rounded-2xl font-bold hover:bg-indigo-700">Save</button>
              <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-100 text-slate-500 py-3 rounded-2xl font-bold">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: History (KEPT UNCHANGED) */}
      {isHistoryOpen && selectedLead && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-3xl w-full max-lg shadow-2xl">
            <div className="flex justify-between items-center mb-4"><h2 className="text-2xl font-black text-slate-800">Activity: {selectedLead.name}</h2><button onClick={() => setIsHistoryOpen(false)}><X/></button></div>
            <div className="mb-4 text-xs text-slate-500 bg-slate-50 p-3 rounded-xl"><p className="flex items-center gap-2 mb-1"><Phone size={12}/> {selectedLead.mobile}</p><p className="flex items-center gap-2"><MapPin size={12}/> {selectedLead.address}</p></div>
            <div className="max-h-60 overflow-y-auto mb-6 space-y-3 pr-2">{selectedLead.interactions && selectedLead.interactions.map(i => (<div key={i.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm">{i.content}<span className="text-[10px] text-slate-400 uppercase font-bold block mt-2">{new Date(i.created_at).toLocaleDateString()}</span></div>))}</div>
            <form onSubmit={handleAddNote} className="space-y-4"><textarea placeholder="New note..." className="w-full p-4 bg-slate-50 border rounded-2xl outline-indigo-500 text-sm min-h-[100px]" value={noteContent} onChange={(e) => setNoteContent(e.target.value)} required /><button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-2xl font-bold">Add Note</button></form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;