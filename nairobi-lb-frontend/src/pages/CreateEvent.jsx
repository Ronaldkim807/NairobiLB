// src/pages/CreateEvent.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { eventsAPI } from '../services/api';

export default function CreateEvent() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'music',
    venue: '',
    address: '',
    city: 'Nairobi',
    startTime: '',
    endTime: '',
    image: '',
    capacity: '',
    ticketTypes: [{ name: 'General Admission', price: '', quantity: '' }],
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [fileUploading, setFileUploading] = useState(false);

  const categories = [
    'music', 'sports', 'conference', 'arts', 'food', 'business',
    'technology', 'education', 'health', 'networking', 'other'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'image') setImagePreview(value || null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      setFormData(prev => ({ ...prev, image: reader.result }));
      setImagePreview(reader.result);
      setFileUploading(false);
    };
    reader.onerror = () => setFileUploading(false);
    reader.readAsDataURL(file);
  };

  const handleTicketTypeChange = (index, field, value) => {
    setFormData(prev => {
      const ticketTypes = [...prev.ticketTypes];
      ticketTypes[index] = { ...ticketTypes[index], [field]: value };
      return { ...prev, ticketTypes };
    });
  };

  const addTicketType = () => setFormData(prev => ({
    ...prev,
    ticketTypes: [...prev.ticketTypes, { name: '', price: '', quantity: '' }]
  }));

  const removeTicketType = (index) => setFormData(prev => ({
    ...prev,
    ticketTypes: prev.ticketTypes.length > 1
      ? prev.ticketTypes.filter((_, i) => i !== index)
      : prev.ticketTypes
  }));

  const toISO = (localDatetime) => localDatetime ? new Date(localDatetime).toISOString() : null;

  const validatePayload = (payload) => {
    if (!payload.title || !payload.startTime) return 'Title and start time are required.';
    if (!payload.venue) return 'Venue is required.';
    if (!Number.isInteger(payload.capacity) || payload.capacity <= 0) return 'Capacity must be a positive integer.';
    if (!payload.ticketTypes.length) return 'At least one ticket type is required.';
    for (const t of payload.ticketTypes) {
      if (!t.name) return 'Each ticket type must have a name.';
      if (isNaN(Number(t.price))) return 'Ticket price must be a number.';
      if (!Number.isInteger(t.quantity) || t.quantity < 0) return 'Ticket quantity must be a non-negative integer.';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!['ORGANIZER', 'ADMIN'].includes(user?.role)) {
      alert('You need to be an organizer (or admin) to create events.');
      return;
    }

    const payload = {
      title: formData.title.trim(),
      description: formData.description?.trim() || null,
      category: formData.category,
      venue: formData.venue.trim(),
      address: formData.address?.trim() || null,
      city: formData.city?.trim() || null,
      startTime: toISO(formData.startTime),
      endTime: toISO(formData.endTime),
      capacity: Number(formData.capacity) || 0,
      imageUrl: formData.image?.trim() || null,
      ticketTypes: formData.ticketTypes.map(t => ({
        name: t.name?.trim() || '',
        price: Number(t.price) || 0,
        quantity: Number(t.quantity) || 0
      }))
    };

    const validationError = validatePayload(payload);
    if (validationError) return alert(validationError);

    setLoading(true);
    try {
      const response = await eventsAPI.create(payload);
      if (response?.data?.success) {
        alert('Event created successfully!');
        navigate('/organizer', { replace: true });
      } else throw new Error(response?.data?.message || 'Failed to create event');
    } catch (err) {
      alert(err?.response?.data?.message || err.message || 'Event creation failed.');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep(s => Math.min(3, s + 1));
  const prevStep = () => setStep(s => Math.max(1, s - 1));

  return (
    <div className="min-h-screen bg-gray-900 text-white pt-16 pb-8">
      <div className="max-w-5xl mx-auto px-4">
        <h1 className="text-4xl font-bold mb-8 text-center text-gradient-to-r from-purple-400 via-pink-500 to-red-500">
          Create Event
        </h1>

        <form onSubmit={handleSubmit} className="bg-gray-800 rounded-3xl shadow-2xl p-8 space-y-8">
          
          {/* Step 1: Event Info */}
          {step === 1 && (
            <div className="space-y-6">
              <InputField label="Title" name="title" value={formData.title} onChange={handleInputChange} placeholder="Enter event title" required />
              
              <SelectField label="Category" name="category" value={formData.category} onChange={handleInputChange} options={categories} />
              
              <TextAreaField label="Description" name="description" value={formData.description} onChange={handleInputChange} placeholder="Write a short description about your event" />

              <div className="grid md:grid-cols-2 gap-4">
                <InputField label="Start Time" name="startTime" type="datetime-local" value={formData.startTime} onChange={handleInputChange} required />
                <InputField label="End Time" name="endTime" type="datetime-local" value={formData.endTime} onChange={handleInputChange} />
              </div>

              <InputField label="City" name="city" value={formData.city} onChange={handleInputChange} placeholder="e.g. Nairobi" />

              <div>
                <label className="block mb-2 font-semibold">Event Image</label>
                <input
                  name="image"
                  value={typeof formData.image === 'string' && !fileUploading ? formData.image : ''}
                  onChange={handleInputChange}
                  placeholder="Paste image URL here"
                  className="w-full px-4 py-2 rounded-xl bg-gray-700 border border-gray-600 focus:ring-2 focus:ring-pink-500 focus:outline-none mb-2"
                />
                <input type="file" accept="image/*" onChange={handleFileChange} className="block mb-2 text-sm text-gray-400" />
                {fileUploading && <p className="text-sm text-gray-400">Processing file…</p>}
                {imagePreview && (
                  <img src={imagePreview} alt="Preview" className="w-64 h-64 object-cover rounded-xl border border-gray-600 mt-2 shadow-lg" />
                )}
              </div>
            </div>
          )}

          {/* Step 2: Venue & Capacity */}
          {step === 2 && (
            <div className="space-y-6">
              <InputField label="Venue" name="venue" value={formData.venue} onChange={handleInputChange} placeholder="Enter venue" required />
              <InputField label="Address (optional)" name="address" value={formData.address} onChange={handleInputChange} placeholder="Street, building, etc." />
              <InputField label="Capacity" name="capacity" type="number" value={formData.capacity} onChange={handleInputChange} placeholder="Number of attendees" required />
            </div>
          )}

          {/* Step 3: Ticket Types */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold mb-4 text-pink-400">Ticket Types</h2>
              {formData.ticketTypes.map((t, i) => (
                <div key={i} className="grid md:grid-cols-3 gap-4 items-end bg-gray-700 p-4 rounded-xl shadow-inner">
                  <InputField label="Name" value={t.name} onChange={e => handleTicketTypeChange(i, 'name', e.target.value)} />
                  <InputField label="Price" value={t.price} onChange={e => handleTicketTypeChange(i, 'price', e.target.value)} />
                  <div>
                    <label className="block mb-1">Quantity</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={t.quantity}
                        onChange={e => handleTicketTypeChange(i, 'quantity', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-gray-700 border border-gray-600 focus:ring-2 focus:ring-pink-500 focus:outline-none"
                      />
                      <button type="button" onClick={() => removeTicketType(i)} className="px-3 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 font-semibold">Remove</button>
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" onClick={addTicketType} className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-semibold">Add Ticket Type</button>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-6">
            <div>
              {step > 1 && <button type="button" onClick={prevStep} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-xl mr-2">Previous</button>}
              {step < 3 && <button type="button" onClick={nextStep} className="px-4 py-2 bg-pink-500 hover:bg-pink-600 rounded-xl text-white">Next</button>}
            </div>
            <button
              type="submit"
              disabled={loading || fileUploading}
              className="px-6 py-3 bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-white rounded-xl font-bold disabled:opacity-50"
            >
              {loading ? 'Saving…' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ================== Helper Components ================== */

const InputField = ({ label, name, value, onChange, placeholder, type = 'text', required = false }) => (
  <div>
    {label && <label className="block mb-1 font-semibold">{label}</label>}
    <input
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      className="w-full px-4 py-2 rounded-xl bg-gray-700 border border-gray-600 focus:ring-2 focus:ring-pink-500 focus:outline-none"
    />
  </div>
);

const TextAreaField = ({ label, name, value, onChange, placeholder, rows = 4 }) => (
  <div>
    {label && <label className="block mb-1 font-semibold">{label}</label>}
    <textarea
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-4 py-2 rounded-xl bg-gray-700 border border-gray-600 focus:ring-2 focus:ring-pink-500 focus:outline-none resize-none"
    />
  </div>
);

const SelectField = ({ label, name, value, onChange, options }) => (
  <div>
    {label && <label className="block mb-1 font-semibold">{label}</label>}
    <select
      name={name}
      value={value}
      onChange={onChange}
      className="w-full px-4 py-2 rounded-xl bg-gray-700 border border-gray-600 focus:ring-2 focus:ring-pink-500 focus:outline-none"
    >
      {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  </div>
);
