import React, { useState } from 'react';
import {
  X,
  User,
  GraduationCap,
  Building,
  Mail,
  Fingerprint,
  CheckCircle2,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

const PRESET_SCHOLARS = [
  {
    name: 'Example 1',
    role: 'RESEARCHSCHOLAR',
    institution: 'RESEARCHSCHOLAR AI Institute',
    email: 'example1@researchscholar.ai',
    orcid: '0000-0001-8820-4109',
    field: 'Agentic AI & Computer Science'
  },
  {
    name: 'Dr. Eleanor Vance',
    role: 'Faculty / Principal Investigator',
    institution: 'Institute for Advanced Study',
    email: 'e.vance@ias.edu',
    orcid: '0000-0002-1825-0097',
    field: 'Computer Science & AI'
  },
  {
    name: 'Marcus Chen, M.Sc.',
    role: 'Doctoral Researcher',
    institution: 'Stanford University (AI Lab)',
    email: 'mchen@cs.stanford.edu',
    orcid: '0000-0001-9234-5510',
    field: 'Machine Learning & NLP'
  },
  {
    name: 'Prof. Amara Okafor',
    role: 'Senior Research Fellow',
    institution: 'University of Oxford',
    email: 'amara.okafor@medsci.ox.ac.uk',
    orcid: '0000-0003-4412-8891',
    field: 'Biomedicine & Genomics'
  }
];

export default function AuthModal({ isOpen = true, onClose, profile, currentProfile, onSaveProfile }) {
  const activeProfile = profile || currentProfile;
  const [name, setName] = useState(activeProfile?.name || 'Example 1');
  const [role, setRole] = useState(activeProfile?.role || 'RESEARCHSCHOLAR');
  const [institution, setInstitution] = useState(activeProfile?.institution || 'RESEARCHSCHOLAR AI Institute');
  const [email, setEmail] = useState(activeProfile?.email || 'example1@researchscholar.ai');
  const [orcid, setOrcid] = useState(activeProfile?.orcid || '0000-0001-8820-4109');
  const [field, setField] = useState(activeProfile?.field || 'Agentic AI & Computer Science');

  if (!isOpen) return null;

  const handleApplyPreset = (preset) => {
    setName(preset.name);
    setRole(preset.role);
    setInstitution(preset.institution);
    setEmail(preset.email);
    setOrcid(preset.orcid);
    setField(preset.field);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSaveProfile({
      name,
      role,
      institution,
      email,
      orcid,
      field,
      isLoggedIn: true
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full border border-[#D7E8DC] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-[#123D32] text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#176B50] flex items-center justify-center text-emerald-200">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-serif text-base font-bold text-white">
                Academic Scholar Profile
              </h2>
              <p className="text-[11px] text-emerald-200 font-sans">
                Research credentials & workspace preferences
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-300 hover:text-white p-1 rounded-lg"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Switcher Presets */}
        <div className="bg-[#FAFDFB] p-3 border-b border-[#E8F1EA]">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
            Quick Scholar Profile Switcher:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_SCHOLARS.map((p, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleApplyPreset(p)}
                className="text-[11px] bg-white hover:bg-[#E8F1EA] border border-[#D1DFD6] hover:border-[#176B50] text-[#123D32] px-2 py-1 rounded transition-colors font-medium truncate max-w-[200px]"
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
          <div>
            <label className="block text-gray-700 font-bold mb-1">Scholar Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#D1DFD6] text-xs text-gray-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-bold mb-1">Academic Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#D1DFD6] text-xs text-gray-800 bg-white"
            >
              <option value="RESEARCHSCHOLAR">RESEARCHSCHOLAR</option>
              <option value="Faculty / Principal Investigator">Faculty / Principal Investigator</option>
              <option value="Doctoral Researcher">Doctoral Researcher</option>
              <option value="Postdoctoral Fellow">Postdoctoral Fellow</option>
              <option value="Graduate Student">Graduate Student</option>
              <option value="Institutional Research Analyst">Institutional Research Analyst</option>
              <option value="Independent Scholar">Independent Scholar</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-700 font-bold mb-1">Primary Affiliation / University</label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="e.g. Oxford, Stanford, MIT, Max Planck Institute..."
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#D1DFD6] text-xs text-gray-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-bold mb-1">Institutional Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#D1DFD6] text-xs text-gray-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-bold mb-1">ORCID iD (optional)</label>
            <div className="relative">
              <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={orcid}
                onChange={(e) => setOrcid(e.target.value)}
                placeholder="0000-0002-XXXX-XXXX"
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#D1DFD6] text-xs font-mono text-gray-800"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-[#123D32] hover:bg-[#176B50] text-white font-bold transition-colors shadow-sm"
            >
              Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
