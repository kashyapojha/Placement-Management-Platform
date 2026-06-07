import React, { useState } from 'react';
import { UserRole, UserProfile } from '../types';
import { API_BASE } from '../services/api';

interface AuthViewProps {
  initialMode?: 'login' | 'register';
  onAuthSuccess: (token: string, user: UserProfile) => void;
  onBackToLanding: () => void;
}

export default function AuthView({ initialMode = 'login', onAuthSuccess, onBackToLanding }: AuthViewProps) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  
  // Form values
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('Student');
  
  // Student fields
  const [college, setCollege] = useState('');
  const [graduationYear, setGraduationYear] = useState('');
  
  // Company fields
  const [companyName, setCompanyName] = useState('');

  // UI state
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);

    if (!email || !password) {
      setErrorMsg('Please enter email and password credentials.');
      setSubmitting(false);
      return;
    }

    if (mode === 'register') {
      if (!name) {
        setErrorMsg('Please enter your full name.');
        setSubmitting(false);
        return;
      }
      if (role === 'Student' && (!college || !graduationYear)) {
        setErrorMsg('Please enter your college and graduation year.');
        setSubmitting(false);
        return;
      }
      if (role === 'Company' && !companyName) {
        setErrorMsg('Please enter your recruiting company name.');
        setSubmitting(false);
        return;
      }
    }

    try {
      // Find API host relative or fallback
      const token = localStorage.getItem('token');
      const endpoint = mode === 'login' ? `${API_BASE}/auth/login` : `${API_BASE}/auth/register`;
      const body: any = { email, password };
      
      if (mode === 'register') {
        body.name = name;
        body.role = role;
        if (role === 'Student') {
          body.college = college;
          body.graduationYear = graduationYear;
        } else if (role === 'Company') {
          body.companyName = companyName;
        } else if (role === 'Admin') {
          body.companyName = 'University System';
        }
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Server rejected credentials.');
      }

      onAuthSuccess(data.token, data.user);
    } catch (err: any) {
      setErrorMsg(err.message || 'Network failure connecting to MongoDB backend.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-page-bg flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans selection:bg-brand-600/20 selection:text-brand-700">
      
      {/* Return to Landing shortcut */}
      <div className="absolute top-8 left-8 text-left">
        <button
          onClick={onBackToLanding}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 font-semibold cursor-pointer py-2 transition-colors"
        >
          <i className="fa-solid fa-arrow-left text-xs" />
          <span className="ml-1">Back to home</span>
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Brand visual logo */}
        <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center text-white font-serif text-xl font-bold mx-auto shadow-sm select-none">
          P
        </div>
        <h2 className="mt-4 font-serif text-3xl font-semibold text-slate-900 leading-tight tracking-tight font-display">
          {mode === 'login' ? 'Sign in to your portal' : 'Create your credentials'}
        </h2>
        <p className="mt-1.5 text-xs text-slate-500">
          {mode === 'login' ? 'Access your dynamic placement portal' : 'Join elite career candidates and coordinators'}
        </p>

        {/* Tab Selection */}
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 border border-slate-200 shadow-lg rounded-2xl sm:px-10">
            
            <div className="flex border-b border-slate-200 pb-4 mb-6 select-none">
              <button
                onClick={() => {
                  setMode('login');
                  setErrorMsg(null);
                }}
                className={`flex-1 text-center py-2 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                  mode === 'login' 
                    ? 'border-brand-600 text-brand-600' 
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setMode('register');
                  setErrorMsg(null);
                }}
                className={`flex-1 text-center py-2 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                  mode === 'register' 
                    ? 'border-brand-600 text-brand-600' 
                    : 'border-transparent text-slate-400 hover:text-slate-655'
                }`}
              >
                Register
              </button>
            </div>

            {/* Error Message Box */}
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs text-left mb-4 flex items-start gap-2 animate-fadeIn select-text">
                <i className="fa-solid fa-triangle-exclamation text-rose-500 mt-0.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              {/* REGISTER SPECIFIC NAME FIELD */}
              {mode === 'register' && (
                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold">Full Name</label>
                  <div className="relative">
                    <i className="fa-solid fa-user absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs animate-pulse" />
                    <input
                      type="text"
                      required
                      placeholder="Marcus Vance"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-page-bg border border-slate-200 focus:border-brand-600 focus:ring-1 focus:ring-brand-600 rounded-xl text-xs placeholder:text-slate-400 font-sans text-slate-900"
                    />
                  </div>
                </div>
              )}

              {/* Email Address */}
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold">Email Address</label>
                <div className="relative">
                  <i className="fa-solid fa-envelope absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                  <input
                    type="email"
                    required
                    placeholder="marcus@cornell.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-page-bg border border-slate-200 focus:border-brand-600 focus:ring-1 focus:ring-brand-600 rounded-xl text-xs placeholder:text-slate-400 font-sans text-slate-900"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold">Password</label>
                <div className="relative">
                  <i className="fa-solid fa-lock absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-page-bg border border-slate-200 focus:border-brand-600 focus:ring-1 focus:ring-brand-600 rounded-xl text-xs placeholder:text-slate-400 font-sans text-slate-900"
                  />
                </div>
              </div>

              {/* REGISTER ROLE NOTICE */}
              {mode === 'register' && (
                <div className="p-3.5 bg-brand-50 border border-brand-100 text-brand-850 rounded-xl text-[10px] leading-relaxed text-left mt-4 flex items-start gap-2 select-none font-sans">
                  <i className="fa-solid fa-circle-info text-brand-600 mt-0.5 shrink-0" />
                  <span>Student registration is enabled. Coordinator, Recruiter, and Administrator credentials must be generated inside the Administrative Control Panel.</span>
                </div>
              )}

              {/* ROLE CONTEXT-DEPENDENT EXTRA REGISTER FIELDS */}
              {mode === 'register' && role === 'Student' && (
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-dashed border-slate-100 animate-fadeIn">
                  <div className="space-y-1 text-left">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold">College / University</label>
                    <input
                      type="text"
                      required
                      placeholder="Cornell University"
                      value={college}
                      onChange={(e) => setCollege(e.target.value)}
                      className="w-full px-3.5 py-2 bg-page-bg border border-slate-200 focus:border-brand-600 focus:ring-1 focus:ring-brand-600 rounded-xl text-xs placeholder:text-slate-400 font-sans text-slate-900"
                    />
                  </div>
                  <div className="space-y-1 text-left">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold">Graduation Year</label>
                    <input
                      type="text"
                      required
                      placeholder="2026"
                      value={graduationYear}
                      onChange={(e) => setGraduationYear(e.target.value)}
                      className="w-full px-3.5 py-2 bg-page-bg border border-slate-200 focus:border-brand-600 focus:ring-1 focus:ring-brand-600 rounded-xl text-xs placeholder:text-slate-400 font-sans text-slate-900"
                    />
                  </div>
                </div>
              )}

              {mode === 'register' && role === 'Company' && (
                <div className="space-y-1 text-left pt-2 border-t border-dashed border-slate-100 animate-fadeIn">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold">Sponsor Entity (Company)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Stripe, Vercel"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-3.5 py-2 bg-page-bg border border-slate-200 focus:border-brand-600 focus:ring-1 focus:ring-brand-600 rounded-xl text-xs placeholder:text-slate-400 font-sans text-slate-900"
                  />
                </div>
              )}

              {/* Submit Trigger */}
              <div className="pt-3.5 select-none">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 px-4 bg-slate-900 hover:bg-brand-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin text-xs" />
                      <span className="ml-1.5">Verifying session...</span>
                    </>
                  ) : (
                    <span>{mode === 'login' ? 'Access Account Portal' : 'Register Secure Profile'}</span>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      </div>
    </div>
  );
}
