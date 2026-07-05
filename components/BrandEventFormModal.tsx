import React, { useState } from 'react';
import { apiClient } from '../firebase';

interface BrandEventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void; // refresh events list
  brandId: string;
}

const volunteerRoles = [
  'Graphic Designer',
  'Photographer',
  'Social Media Manager',
  'Other',
];

export const BrandEventFormModal: React.FC<BrandEventFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  brandId,
}) => {
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [targetSponsorship, setTargetSponsorship] = useState('');
  const [needVolunteers, setNeedVolunteers] = useState(false);
  const [volunteerRole, setVolunteerRole] = useState(volunteerRoles[0]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !date.trim()) {
      setError('Name and date are required');
      return;
    }
    if (needVolunteers && !volunteerRole) {
      setError('Select a volunteer role');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const payload: any = {
        name,
        date,
        location,
        description,
        targetSponsorship: targetSponsorship ? Number(targetSponsorship) : 0,
        brandId,
        volunteer: needVolunteers ? { role: volunteerRole } : null,
      };
      const res = await apiClient.post('events', payload);
      const createdEvent = res.data;
      // If volunteers needed, link to volunteer campaign
      if (needVolunteers && createdEvent?.id) {
        await fetch('/api/volunteer/link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventId: createdEvent.id, brandId }),
        });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Create event error:', err);
      setError(err.response?.data?.error || err.message || 'Failed to create event');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-spark-black/60 backdrop-blur-md z-[300] flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-300">
      <div className="bg-[var(--bg-primary)] w-full max-w-2xl rounded-[2rem] sm:rounded-[4rem] overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-300 my-auto border border-[var(--border-color)]">
        {/* Close */}
        <button onClick={onClose} disabled={submitting}
          className="absolute top-6 right-6 w-12 h-12 bg-[var(--bg-primary)] border border-[var(--border-color)] hover:bg-red-50 rounded-2xl flex items-center justify-center transition-all z-10 disabled:opacity-50">
          <span className="text-2xl text-[var(--text-secondary)] hover:text-spark-red">×</span>
        </button>
        {/* Header */}
        <div className="bg-spark-red p-8 sm:p-12">
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-2">Create New Event</h2>
          <p className="text-white/90 font-bold">Add an event for your brand</p>
        </div>
        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-12 modal-content-scroll space-y-6">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-2xl">
              <p className="text-red-700 font-bold text-sm">{error}</p>
            </div>
          )}
          {/* Name */}
          <div>
            <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase mb-2">Event Name *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required
              className="w-full px-4 py-3 border-2 border-[var(--border-color)] bg-[var(--bg-primary)] rounded-2xl focus:border-spark-red outline-none font-bold text-[var(--text-primary)]" />
          </div>
          {/* Date */}
          <div>
            <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase mb-2">Date *</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} required
              className="w-full px-4 py-3 border-2 border-[var(--border-color)] bg-[var(--bg-primary)] rounded-2xl focus:border-spark-red outline-none font-bold text-[var(--text-primary)]" />
          </div>
          {/* Location */}
          <div>
            <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase mb-2">Location</label>
            <input type="text" value={location} onChange={e => setLocation(e.target.value)}
              className="w-full px-4 py-3 border-2 border-[var(--border-color)] bg-[var(--bg-primary)] rounded-2xl focus:border-spark-red outline-none font-bold text-[var(--text-primary)]" />
          </div>
          {/* Description */}
          <div>
            <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase mb-2">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4}
              className="w-full px-4 py-3 border-2 border-[var(--border-color)] bg-[var(--bg-primary)] rounded-2xl focus:border-spark-red outline-none font-bold text-[var(--text-primary)]" />
          </div>
          {/* Sponsorship */}
          <div>
            <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase mb-2">Target Sponsorship (₦)</label>
            <input type="number" min="0" value={targetSponsorship} onChange={e => setTargetSponsorship(e.target.value)}
              className="w-full px-4 py-3 border-2 border-[var(--border-color)] bg-[var(--bg-primary)] rounded-2xl focus:border-spark-red outline-none font-bold text-[var(--text-primary)]" />
          </div>
          {/* Volunteer Checkbox */}
          <div className="flex items-center space-x-3">
            <input id="needVolunteers" type="checkbox" checked={needVolunteers} onChange={e => setNeedVolunteers(e.target.checked)}
              className="w-4 h-4 text-spark-red bg-[var(--bg-primary)] border-[var(--border-color)] rounded" />
            <label htmlFor="needVolunteers" className="text-[var(--text-primary)] font-black">I need volunteers for this event</label>
          </div>
          {/* Volunteer Role Dropdown */}
          {needVolunteers && (
            <div>
              <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase mb-2">Volunteer Role *</label>
              <select value={volunteerRole} onChange={e => setVolunteerRole(e.target.value)} required
                className="w-full px-4 py-3 border-2 border-[var(--border-color)] bg-[var(--bg-primary)] rounded-2xl focus:border-spark-red outline-none font-bold text-[var(--text-primary)]">
                {volunteerRoles.map(r => (<option key={r} value={r}>{r}</option>))}
              </select>
            </div>
          )}
          {/* Submit */}
          <button type="submit" disabled={submitting}
            className="w-full py-4 font-black text-xl rounded-2xl bg-spark-red text-white hover:bg-red-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
            {submitting ? (
              <><span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" /></>
            ) : 'Create Event'}
          </button>
        </form>
      </div>
    </div>
  );
};
