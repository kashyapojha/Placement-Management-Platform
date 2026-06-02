import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Mail, 
  Lock, 
  User, 
  Building2, 
  GraduationCap, 
  Shield, 
  BadgeCheck,
  Check, 
  AlertCircle,
  RefreshCw 
} from 'lucide-react';
import { UserRole, UserProfile } from '../types';

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

  const API_BASE = 'http://localhost:5000/api';

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

      // Trigger success hook in App.tsx
      onAuthSuccess(data.token, data.user);
    } catch (err: any) {
      setErrorMsg(err.message || 'Network failure connecting to MongoDB backend.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-page-bg flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans selection:bg-editorial-light/20 selection:text-editorial">
      
      {/* Return to Landing shortcut */}
      <div className="absolute top-8 left-8">
        <button
          onClick={onBackToLanding}
          className="flex items-center gap-1.5 text-xs text-text-muted hover:text-editorial font-semibold cursor-pointer py-2 transition-colors"
        >
          <ArrowLeft size={14} />
          Back to home
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Brand visual logo */}
        <div className="w-10 h-10 bg-editorial-light rounded-xl flex items-center justify-center text-white font-serif text-xl font-bold mx-auto shadow-sm select-none">
          I
        </div>
        <h2 className="mt-4 font-serif text-3xl font-semibold text-editorial leading-tight tracking-tight">
          {mode === 'login' ? 'Sign in to your portal' : 'Create your credentials'}
        </h2>
        <p className="mt-1.5 text-xs text-text-muted">
          {mode === 'login' ? 'Access your dynamic recruitment pipeline' : 'Join elite developers and design scholars'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 border border-[#E5E2DE] sm:rounded-2xl sm:px-10 shadow-sm relative">
          
          {/* Tab Selection */}
          <div className="flex border-b border-[#F1F0EC] mb-6">
            <button
              onClick={() => { setMode('login'); setErrorMsg(null); }}
              className={`flex-1 pb-3 text-center text-xs font-bold transition-all cursor-pointer ${
                mode === 'login' 
                  ? 'border-b-2 border-editorial-light text-editorial-light' 
                  : 'text-text-muted hover:text-editorial border-b border-transparent'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode('register'); setErrorMsg(null); }}
              className={`flex-1 pb-3 text-center text-xs font-bold transition-all cursor-pointer ${
                mode === 'register' 
                  ? 'border-b-2 border-editorial-light text-editorial-light' 
                  : 'text-text-muted hover:text-editorial border-b border-transparent'
              }`}
            >
              Register Account
            </button>
          </div>

          {/* Form Error Dialogue */}
          {errorMsg && (
            <div className="p-3 bg-red-50/60 border border-red-200 rounded-xl flex items-start gap-2.5 mb-5 text-left text-xs text-red-700 animate-fadeIn select-text">
              <AlertCircle size={14} className="shrink-0 mt-0.5 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* REGISTER SPECIFIC NAME FIELD */}
            {mode === 'register' && (
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-mono uppercase tracking-wider text-text-muted">Full Name</label>
                <div className="relative">
                  <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-light" />
                  <input
                    type="text"
                    required
                    placeholder="Marcus Vance"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-page-bg border border-[#E5E2DE] focus:border-editorial-light focus:ring-1 focus:ring-editorial-light rounded-xl text-xs placeholder:text-text-light font-sans text-text-main"
                  />
                </div>
              </div>
            )}

            {/* Email Address */}
            <div className="space-y-1 text-left">
              <label className="text-[10px] font-mono uppercase tracking-wider text-text-muted">Email Address</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-light" />
                <input
                  type="email"
                  required
                  placeholder="marcus@cornell.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-page-bg border border-[#E5E2DE] focus:border-editorial-light focus:ring-1 focus:ring-editorial-light rounded-xl text-xs placeholder:text-text-light font-sans text-text-main"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1 text-left">
              <label className="text-[10px] font-mono uppercase tracking-wider text-text-muted">Password</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-light" />
                <input
                  type="password"
                  required
                  placeholder="G求G求G求G求G求G求G求G求"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-page-bg border border-[#E5E2DE] focus:border-editorial-light focus:ring-1 focus:ring-editorial-light rounded-xl text-xs placeholder:text-text-light font-sans text-text-main"
                />
              </div>
            </div>

            {/* REGISTER ROLE SELECTOR */}
            {mode === 'register' && (
              <div className="space-y-2 text-left pt-2 border-t border-[#F1F0EC] mt-4">
                <label className="text-[10px] font-mono uppercase tracking-wider text-text-muted">Select Academic Mode (Role)</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'Student', label: 'Student', icon: GraduationCap },
                    { id: 'Company', label: 'Recruiter', icon: Building2 },
                    { id: 'Admin', label: 'Admin', icon: Shield },
                    { id: 'Faculty', label: 'Faculty', icon: BadgeCheck }
                  ].map((r) => {
                    const Icon = r.icon;
                    const isSelected = role === r.id;
                    return (
                      <button
                        type="button"
                        key={r.id}
                        onClick={() => setRole(r.id as UserRole)}
                        className={`py-2 px-1 rounded-xl border text-center flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                          isSelected 
                            ? 'bg-editorial text-white border-editorial shadow-xs' 
                            : 'bg-page-bg border-[#E5E2DE] text-text-muted hover:border-editorial-light hover:text-editorial'
                        }`}
                      >
                        <Icon size={16} />
                        <span className="text-[9px] font-bold tracking-tight">{r.label}</span>
                        {isSelected && <Check size={10} className="absolute top-1 right-1 text-white hidden" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ROLE CONTEXT-DEPENDENT EXTRA REGISTER FIELDS */}
            {mode === 'register' && role === 'Student' && (
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-dashed border-[#F1F0EC] animate-fadeIn">
                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-text-muted">College major</label>
                  <input
                    type="text"
                    required
                    placeholder="Cornell University"
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    className="w-full px-3.5 py-2 bg-page-bg border border-[#E5E2DE] focus:border-editorial-light focus:ring-1 focus:ring-editorial-light rounded-xl text-xs placeholder:text-text-light font-sans text-text-main"
                  />
                </div>
                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-text-muted">Graduation Year</label>
                  <input
                    type="text"
                    required
                    placeholder="2026"
                    value={graduationYear}
                    onChange={(e) => setGraduationYear(e.target.value)}
                    className="w-full px-3.5 py-2 bg-page-bg border border-[#E5E2DE] focus:border-editorial-light focus:ring-1 focus:ring-editorial-light rounded-xl text-xs placeholder:text-text-light font-sans text-text-main"
                  />
                </div>
              </div>
            )}

            {mode === 'register' && role === 'Company' && (
              <div className="space-y-1 text-left pt-2 border-t border-dashed border-[#F1F0EC] animate-fadeIn">
                <label className="text-[10px] font-mono uppercase tracking-wider text-text-muted">Sponsor Entity (Company)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Stripe, Vercel"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-page-bg border border-[#E5E2DE] focus:border-editorial-light focus:ring-1 focus:ring-editorial-light rounded-xl text-xs placeholder:text-text-light font-sans text-text-main"
                />
              </div>
            )}

            {/* Submit Trigger */}
            <div className="pt-3.5 select-none">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 bg-editorial hover:bg-editorial-light text-white rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="animate-spin" size={13} />
                    <span>Verifying session...</span>
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
  );
}

