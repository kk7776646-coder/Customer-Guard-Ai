import React, { useState, useEffect } from 'react';
import {
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  Mail,
  Plus,
  Sparkles,
  TrendingUp,
  Sun,
  Moon,
  Zap,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ClarioLogo } from '../ui';

interface AuthPageProps {
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  onSuccessNavigate?: () => void;
}

type AuthMode = 'signin' | 'signup' | 'forgot' | 'update_password';

export const AuthPage: React.FC<AuthPageProps> = ({
  theme = 'dark',
  onToggleTheme,
  onSuccessNavigate,
}) => {
  const {
    signIn,
    signUp,
    resetPasswordForEmail,
    updatePassword,
    isPasswordRecovery,
    clearPasswordRecoveryFlag,
  } = useAuth();

  const [mode, setMode] = useState<AuthMode>('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('alex.vance@clario.io');
  const [password, setPassword] = useState('••••••••');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Submission & feedback states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isVerificationPending, setIsVerificationPending] = useState(false);

  // Interactive Showcase State (Right Panel)
  const [selectedShowcaseCustomer, setSelectedShowcaseCustomer] = useState(1);
  const [appliedStrategy, setAppliedStrategy] = useState<'upgrade' | 'support' | 'discount'>('upgrade');

  useEffect(() => {
    if (isPasswordRecovery) {
      setMode('update_password');
    }
  }, [isPasswordRecovery]);

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsVerificationPending(false);
    if (newMode === 'signup' && email === 'alex.vance@clario.io') {
      setEmail('');
      setPassword('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (mode === 'signup') {
      if (!fullName.trim()) {
        setErrorMessage('Please enter your full name.');
        return;
      }
      if (password.length < 6) {
        setErrorMessage('Password must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match.');
        return;
      }
    }

    if (mode === 'signin' && !password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    if (mode === 'update_password') {
      if (password.length < 6) {
        setErrorMessage('New password must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match.');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (mode === 'signin') {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            setErrorMessage('Invalid email or password. Please verify your credentials or create an account.');
          } else if (error.message.includes('Email not confirmed')) {
            setErrorMessage('Your email address has not been verified yet. Please check your inbox.');
          } else {
            setErrorMessage(error.message || 'Failed to sign in. Please try again.');
          }
        } else {
          onSuccessNavigate?.();
        }
      } else if (mode === 'signup') {
        const { error, isPendingVerification } = await signUp(email, password, fullName);
        if (error) {
          if (error.message.includes('User already registered')) {
            setErrorMessage('An account with this email already exists. Please sign in instead.');
          } else {
            setErrorMessage(error.message || 'Failed to create account. Please try again.');
          }
        } else if (isPendingVerification) {
          setIsVerificationPending(true);
          setSuccessMessage(`Verification email sent to ${email}. Please check your inbox to confirm.`);
        } else {
          onSuccessNavigate?.();
        }
      } else if (mode === 'forgot') {
        const { error } = await resetPasswordForEmail(email);
        if (error) {
          setErrorMessage(error.message || 'Failed to send reset email. Please try again.');
        } else {
          setSuccessMessage(`Password recovery link sent to ${email}. Please check your inbox.`);
        }
      } else if (mode === 'update_password') {
        const { error } = await updatePassword(password);
        if (error) {
          setErrorMessage(error.message || 'Failed to update password. Please try again.');
        } else {
          clearPasswordRecoveryFlag();
          setSuccessMessage('Your password has been successfully updated! You can now sign in.');
          setMode('signin');
          setPassword('');
          setConfirmPassword('');
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const showcaseAccounts = [
    { id: 0, name: 'Acme Corp', logo: 'AC', arr: '$48.5k', risk: '89%' },
    { id: 1, name: 'TechFlow', logo: 'TF', arr: '$92.0k', risk: '14%' },
    { id: 2, name: 'Apex Ltd', logo: 'AL', arr: '$34.2k', risk: '68%' },
    { id: 3, name: 'Novis AI', logo: 'NV', arr: '$64.0k', risk: '22%' },
  ];

  const currentShowcase = showcaseAccounts[selectedShowcaseCustomer];

  return (
    <div className="min-h-screen w-full bg-[#EAEEF4] dark:bg-[#070A11] flex flex-col items-center justify-center p-3 sm:p-4 lg:p-6 overflow-y-auto font-sans antialiased text-[#0F172A] dark:text-slate-100 transition-colors duration-200">
      
      {/* Theme Toggle Button */}
      {onToggleTheme && (
        <button
          onClick={onToggleTheme}
          aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="fixed top-4 right-4 z-50 h-9 w-9 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 shadow-md flex items-center justify-center backdrop-blur-md hover:scale-105 transition cursor-pointer"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-violet-600" />}
        </button>
      )}

      {/* Main Container Card */}
      <div className="w-full max-w-[1180px] my-auto bg-white dark:bg-[#0F172A] rounded-[24px] sm:rounded-[30px] shadow-[0_20px_60px_-15px_rgba(15,23,42,0.18)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col lg:flex-row border border-[#E2E8F0] dark:border-slate-800/80 transition-colors">
        
        {/* ============================================================ */}
        {/* LEFT SECTION: AUTHENTICATION FORM                            */}
        {/* ============================================================ */}
        <div className="w-full lg:w-[48%] xl:w-[50%] p-5 sm:p-7 lg:p-8 flex flex-col justify-between bg-white dark:bg-[#0F172A] relative min-h-0">
          
          {/* Top Brand Logo */}
          <div className="flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <ClarioLogo size={28} />
              <span className="text-[20px] font-bold tracking-tight text-[#0F172A] dark:text-white flex items-center font-display">
                CLARIO<span className="text-violet-600 dark:text-violet-400">.</span>
              </span>
            </div>
            
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/70 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700/60 hidden sm:inline-block">
              Workspace v2.4
            </span>
          </div>

          {/* Center Form Section */}
          <div className="my-auto py-3 sm:py-5 max-w-[370px] w-full mx-auto">
            
            {/* Header Titles */}
            <div className="text-center mb-4 sm:mb-5">
              <h1 className="text-[22px] sm:text-[25px] font-bold text-[#0F172A] dark:text-white tracking-tight leading-tight">
                {mode === 'signin' && 'Welcome Back'}
                {mode === 'signup' && 'Create Your Account'}
                {mode === 'forgot' && 'Reset Your Password'}
                {mode === 'update_password' && 'Set New Password'}
              </h1>
              <p className="text-[12px] sm:text-[13px] text-[#64748B] dark:text-slate-400 mt-1 font-normal leading-normal">
                {mode === 'signin' && 'Sign in to your customer intelligence workspace.'}
                {mode === 'signup' && 'Start understanding your customers with Clario.'}
                {mode === 'forgot' && 'Enter your email address to receive recovery instructions.'}
                {mode === 'update_password' && 'Choose a secure new password for your account.'}
              </p>
            </div>

            {/* Social Sign-In Buttons */}
            {mode === 'signin' && (
              <>
                <div className="grid grid-cols-2 gap-2.5 mb-4">
                  {/* Google Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage('Google SSO is enabled for enterprise accounts. You can also sign in with email below.');
                    }}
                    className="flex items-center justify-center gap-2 h-[42px] px-3 rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-800/60 hover:bg-[#F8FAFC] dark:hover:bg-slate-800 transition-all duration-150 text-[12px] font-medium text-[#1E293B] dark:text-slate-200 cursor-pointer shadow-2xs active:scale-[0.98]"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span className="truncate">Google SSO</span>
                  </button>

                  {/* Apple Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage('Apple ID authentication is configured. You can also sign in with email below.');
                    }}
                    className="flex items-center justify-center gap-2 h-[42px] px-3 rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-800/60 hover:bg-[#F8FAFC] dark:hover:bg-slate-800 transition-all duration-150 text-[12px] font-medium text-[#1E293B] dark:text-slate-200 cursor-pointer shadow-2xs active:scale-[0.98]"
                  >
                    <svg className="w-4 h-4 fill-current text-[#0F172A] dark:text-white shrink-0" viewBox="0 0 24 24">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.35c.64-.78 1.08-1.85.96-2.93-.93.04-2.08.62-2.74 1.4-.59.68-1.1 1.77-.96 2.83 1.04.08 2.1-.52 2.74-1.3z" />
                    </svg>
                    <span className="truncate">Sign In with Apple</span>
                  </button>
                </div>

                {/* Divider */}
                <div className="relative flex items-center justify-center my-4">
                  <div className="w-full border-t border-[#E2E8F0] dark:border-slate-800" />
                  <span className="absolute bg-white dark:bg-[#0F172A] px-3 text-[11px] text-[#94A3B8] dark:text-slate-500 font-normal">
                    Or with email
                  </span>
                </div>
              </>
            )}

            {/* Error Alert */}
            {errorMessage && (
              <div className="p-3 mb-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-snug">{errorMessage}</span>
              </div>
            )}

            {/* Success Alert */}
            {successMessage && (
              <div className="p-3 mb-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-400 text-xs flex items-start gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-snug">{successMessage}</span>
              </div>
            )}

            {/* Verification Pending Card */}
            {isVerificationPending ? (
              <div className="rounded-2xl p-5 bg-[#F8FAFC] dark:bg-slate-800/40 border border-[#E2E8F0] dark:border-slate-700/60 text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 mx-auto flex items-center justify-center border border-violet-100 dark:border-violet-900/40">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-[15px] text-[#0F172A] dark:text-white">Check your inbox</h3>
                  <p className="text-xs text-[#64748B] dark:text-slate-400 leading-relaxed">
                    We sent a confirmation link to <strong className="text-[#0F172A] dark:text-slate-200">{email}</strong>.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => switchMode('signin')}
                  className="w-full h-10 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold transition cursor-pointer"
                >
                  Return to Sign In
                </button>
              </div>
            ) : (
              /* FORM FIELDS */
              <form onSubmit={handleSubmit} className="space-y-3">
                {/* Back button */}
                {mode === 'forgot' && (
                  <button
                    type="button"
                    onClick={() => switchMode('signin')}
                    className="inline-flex items-center gap-1.5 text-xs text-[#64748B] dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-white transition mb-1 cursor-pointer font-medium"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Sign In</span>
                  </button>
                )}

                {/* Full Name */}
                {mode === 'signup' && (
                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Alex Vance"
                      required
                      disabled={isSubmitting}
                      className="w-full h-[44px] px-3.5 rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-800/80 text-[13px] text-[#0F172A] dark:text-slate-100 placeholder:text-[#94A3B8] dark:placeholder:text-slate-500 focus:outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-600/15 transition shadow-2xs font-normal"
                    />
                  </div>
                )}

                {/* Email Address */}
                {mode !== 'update_password' && (
                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="alex.vance@clario.io"
                      required
                      disabled={isSubmitting}
                      className="w-full h-[44px] px-3.5 rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-800/80 text-[13px] text-[#0F172A] dark:text-slate-100 placeholder:text-[#94A3B8] dark:placeholder:text-slate-500 focus:outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-600/15 transition shadow-2xs font-normal"
                    />
                  </div>
                )}

                {/* Password */}
                {mode !== 'forgot' && (
                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        disabled={isSubmitting}
                        className="w-full h-[44px] px-3.5 pr-10 rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-800/80 text-[13px] text-[#0F172A] dark:text-slate-100 placeholder:text-[#94A3B8] dark:placeholder:text-slate-500 focus:outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-600/15 transition shadow-2xs tracking-wider font-normal"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B] dark:hover:text-slate-300 cursor-pointer p-1 transition"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" strokeWidth={1.75} />
                        ) : (
                          <Eye className="w-4 h-4" strokeWidth={1.75} />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Confirm Password */}
                {(mode === 'signup' || mode === 'update_password') && (
                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        disabled={isSubmitting}
                        className="w-full h-[44px] px-3.5 pr-10 rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-800/80 text-[13px] text-[#0F172A] dark:text-slate-100 placeholder:text-[#94A3B8] dark:placeholder:text-slate-500 focus:outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-600/15 transition shadow-2xs font-normal"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        aria-label="Toggle confirm password"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B] dark:hover:text-slate-300 cursor-pointer p-1 transition"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-4 h-4" strokeWidth={1.75} />
                        ) : (
                          <Eye className="w-4 h-4" strokeWidth={1.75} />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Checkbox & Forgot Password */}
                {mode === 'signin' && (
                  <div className="flex items-center justify-between pt-0.5 pb-0.5">
                    <label className="flex items-center gap-2 cursor-pointer select-none text-[12px] text-[#1E293B] dark:text-slate-300">
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={rememberMe}
                        onClick={() => setRememberMe(!rememberMe)}
                        className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ${
                          rememberMe ? 'bg-violet-600 text-white' : 'border border-[#CBD5E1] dark:border-slate-600 bg-white dark:bg-slate-800'
                        }`}
                      >
                        {rememberMe && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </button>
                      <span className="font-normal text-[#334155] dark:text-slate-300">Remember me</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => switchMode('forgot')}
                      className="text-[12px] font-medium text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>
                )}

                {/* Submit Action Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-[44px] rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-[13px] font-semibold transition-all duration-150 cursor-pointer shadow-[0_4px_14px_rgba(124,58,237,0.3)] hover:shadow-[0_6px_20px_rgba(124,58,237,0.4)] flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed mt-2 active:scale-[0.99]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <span>
                      {mode === 'signin' && 'Sign In'}
                      {mode === 'signup' && 'Create Account'}
                      {mode === 'forgot' && 'Send Reset Email'}
                      {mode === 'update_password' && 'Update Password'}
                    </span>
                  )}
                </button>
              </form>
            )}

            {/* Bottom Mode Switcher */}
            <div className="text-center text-[12px] text-[#64748B] dark:text-slate-400 mt-4">
              {mode === 'signin' ? (
                <p>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('signup')}
                    className="font-semibold text-[#0F172A] dark:text-white hover:text-violet-600 dark:hover:text-violet-400 transition cursor-pointer"
                  >
                    Create an account
                  </button>
                </p>
              ) : (
                <p>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('signin')}
                    className="font-semibold text-[#0F172A] dark:text-white hover:text-violet-600 dark:hover:text-violet-400 transition cursor-pointer"
                  >
                    Sign In
                  </button>
                </p>
              )}
            </div>
          </div>

          {/* Bottom Legal Footer */}
          <div className="flex items-center justify-between text-[11px] text-[#94A3B8] dark:text-slate-500 pt-3 border-t border-slate-100 dark:border-slate-800/60 shrink-0 mt-2">
            <div className="flex items-center gap-3">
              <a href="#privacy" className="hover:text-[#64748B] dark:hover:text-slate-400 transition">
                Privacy Policy
              </a>
              <span aria-hidden="true">·</span>
              <a href="#terms" className="hover:text-[#64748B] dark:hover:text-slate-400 transition">
                Terms of Service
              </a>
            </div>
            <span>Copyright 2026 Clario Inc.</span>
          </div>
        </div>

        {/* ============================================================ */}
        {/* RIGHT SECTION: PREMIUM CHARCOAL SHOWCASE PANEL               */}
        {/* ============================================================ */}
        <div className="w-full lg:w-[52%] xl:w-[50%] bg-[#0B0F19] dark:bg-[#080C14] p-5 sm:p-7 lg:p-8 flex flex-col justify-between relative overflow-hidden text-white select-none border-t lg:border-t-0 lg:border-l border-slate-800/60 min-h-0">
          
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-32 -right-32 w-80 h-80 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top Right Dotted Indicator */}
          <div className="absolute top-5 right-5 flex flex-col gap-1 opacity-25 font-mono text-[9px] tracking-widest text-slate-300">
            <div>||| = =</div>
            <div>||  = -</div>
            <div>==  - -</div>
          </div>

          {/* Tilted Square Accent */}
          <div className="absolute top-16 left-10 w-20 h-20 rounded-2xl bg-white/[0.03] border border-white/10 rotate-12 pointer-events-none" />

          {/* Floating UI Mockup Showcase Container */}
          <div className="relative z-10 w-full max-w-[360px] sm:max-w-[390px] mx-auto my-auto py-2">
            
            {/* The Main Showcase Card */}
            <div className="bg-white dark:bg-slate-900 rounded-[20px] p-4 sm:p-5 text-[#0F172A] dark:text-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.35)] border border-slate-200/80 dark:border-slate-800 relative z-10">
              
              {/* Card Header */}
              <div className="text-center pb-2.5 border-b border-slate-100 dark:border-slate-800/80">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 text-[9px] font-semibold uppercase tracking-wider mb-1 border border-violet-100 dark:border-violet-900/40">
                  <Sparkles className="w-3 h-3" />
                  <span>AI Churn Intelligence</span>
                </div>
                <h3 className="font-bold text-[14px] sm:text-[15px] text-[#0F172A] dark:text-white tracking-tight">
                  Customer Retention Workspace
                </h3>
                <p className="text-[10px] text-[#64748B] dark:text-slate-400 max-w-[220px] mx-auto leading-tight mt-0.5">
                  Real-time predictive scoring & account health actions
                </p>
              </div>

              {/* Monitored Accounts Row */}
              <div className="my-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="block text-[10px] font-semibold text-[#0F172A] dark:text-slate-200">
                    Monitored Accounts
                  </span>
                  <span className="text-[9px] text-slate-400 font-normal">
                    {showcaseAccounts.length} High Priority
                  </span>
                </div>
                <div className="flex items-center justify-between gap-1">
                  
                  {/* + Add Button */}
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-9 h-9 rounded-full border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:border-violet-500 hover:text-violet-500 transition cursor-pointer bg-slate-50 dark:bg-slate-800/50">
                      <Plus className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[9px] text-slate-500 font-medium">Score</span>
                  </div>

                  {/* Customer Account Avatar Buttons */}
                  {showcaseAccounts.map((acc, idx) => {
                    const isSelected = selectedShowcaseCustomer === idx;
                    return (
                      <button
                        key={acc.name}
                        type="button"
                        onClick={() => setSelectedShowcaseCustomer(idx)}
                        className="flex flex-col items-center gap-1 cursor-pointer focus:outline-none transition group"
                      >
                        <div className="relative">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-[10px] transition-all ${
                              isSelected
                                ? 'bg-violet-600 text-white ring-2 ring-violet-500 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 shadow-md scale-105'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                          >
                            {acc.logo}
                          </div>
                        </div>
                        <span className={`text-[9px] font-medium truncate max-w-[50px] ${isSelected ? 'text-[#0F172A] dark:text-white font-semibold' : 'text-slate-500'}`}>
                          {acc.name.split(' ')[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Recommended Action Section */}
              <div className="mb-2.5">
                <div className="flex items-center justify-between text-[10px] mb-1.5">
                  <span className="font-semibold text-[#0F172A] dark:text-slate-200">Recommended Action</span>
                  <span className="text-violet-600 dark:text-violet-400 font-semibold text-[9px] cursor-pointer hover:underline flex items-center gap-0.5">
                    Apply Action <ChevronRight className="w-2.5 h-2.5" />
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAppliedStrategy('upgrade')}
                    className={`p-2 rounded-lg text-left relative flex flex-col justify-between transition border cursor-pointer ${
                      appliedStrategy === 'upgrade'
                        ? 'border-violet-500 bg-violet-50/70 dark:bg-violet-950/40'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-semibold text-slate-800 dark:text-slate-200">Annual Upgrade</span>
                      <span className={`w-3 h-3 rounded-full flex items-center justify-center text-[7px] font-bold ${
                        appliedStrategy === 'upgrade' ? 'bg-violet-600 text-white' : 'border border-slate-300 dark:border-slate-700'
                      }`}>
                        {appliedStrategy === 'upgrade' && '✓'}
                      </span>
                    </div>
                    <div className="text-[9px] text-emerald-600 dark:text-emerald-400 font-medium mt-1.5">
                      -34% Churn Risk
                    </div>
                  </button>

                  <div className="p-2 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-700 text-white flex flex-col justify-between shadow-xs">
                    <div className="flex items-center justify-between text-[8px] font-semibold">
                      <span className="opacity-90">CLARIO AI</span>
                      <span className="font-mono text-[7px] bg-white/20 px-1 rounded">ACCURACY 94%</span>
                    </div>
                    <div className="mt-1">
                      <div className="text-[7px] opacity-80">Protected Account ARR</div>
                      <div className="text-[11px] font-bold tracking-tight">{currentShowcase.arr}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Retention Metrics Row */}
              <div className="grid grid-cols-2 gap-2 pt-0.5">
                <div className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between text-[9px] bg-slate-50/80 dark:bg-slate-800/50">
                  <div>
                    <span className="font-semibold text-[#0F172A] dark:text-slate-200 block leading-none">Support Bundle</span>
                    <span className="text-[8px] text-slate-500 dark:text-slate-400">+$24.5k Protected</span>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>

                <div className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between text-[9px] bg-slate-50/80 dark:bg-slate-800/50">
                  <div>
                    <span className="text-[7.5px] text-slate-500 dark:text-slate-400 block leading-none">Active Account Risk</span>
                    <span className={`font-bold text-[10px] ${currentShowcase.risk === '89%' || currentShowcase.risk === '68%' ? 'text-rose-500' : 'text-emerald-500'}`}>
                      {currentShowcase.risk} Probability
                    </span>
                  </div>
                  <div className="w-3.5 h-3.5 rounded-full bg-violet-600/20 text-violet-600 dark:text-violet-400 flex items-center justify-center text-[8px] font-bold">
                    AI
                  </div>
                </div>
              </div>

            </div>

            {/* Floating Pop-out Card #1: Total ARR Saved (Upper Right) */}
            <div className="absolute -top-2 -right-2 sm:-right-4 bg-white dark:bg-slate-800 rounded-xl p-2.5 sm:p-3 shadow-[0_12px_30px_rgba(0,0,0,0.3)] border border-slate-100 dark:border-slate-700 z-20 w-[155px] sm:w-[170px] animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between text-[9px] text-slate-400 mb-0.5 font-medium">
                <span>ARR Saved This Month</span>
                <span className="text-slate-400">•••</span>
              </div>
              <div className="text-[16px] sm:text-[18px] font-bold text-[#0F172A] dark:text-white leading-tight">
                $184,920.00 <span className="text-[9px] text-slate-400 font-normal">USD</span>
              </div>
              <div className="flex items-center gap-1 text-[8px] font-semibold text-emerald-500 dark:text-emerald-400 mt-1">
                <TrendingUp className="w-2.5 h-2.5" />
                <span>+18.4% vs prev</span>
                <span className="text-slate-400 font-normal">Nov 2026</span>
              </div>
            </div>

            {/* Floating Pop-out Card #2: Proactive AI Alert (Lower Left) */}
            <div className="absolute bottom-6 -left-2 sm:-left-4 bg-white dark:bg-slate-800 rounded-xl p-2 sm:p-2.5 shadow-[0_12px_30px_rgba(0,0,0,0.3)] border border-slate-100 dark:border-slate-700 z-20 flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-7 h-7 rounded-full bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center font-bold text-xs shrink-0 border border-violet-100 dark:border-violet-900/40">
                <Zap className="w-3.5 h-3.5" />
              </div>
              <div className="text-left">
                <div className="text-[10px] font-bold text-[#0F172A] dark:text-white leading-tight">Retention Alert</div>
                <div className="text-[8px] text-slate-500 dark:text-slate-400">12 accounts safe</div>
              </div>
              <div className="text-right pl-2 border-l border-slate-100 dark:border-slate-700">
                <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 leading-tight">+$42.8k</div>
                <div className="text-[7.5px] text-slate-400">Just now</div>
              </div>
            </div>

          </div>

          {/* Bottom Headline & Tagline Section */}
          <div className="relative z-10 text-center max-w-[400px] mx-auto pt-2 pb-1 shrink-0">
            <h2 className="text-[19px] sm:text-[22px] font-bold text-white tracking-tight leading-tight font-display">
              Turn Customer Data Into Smarter Decisions.
            </h2>
            <p className="text-[11px] text-slate-300/90 mt-1.5 leading-normal font-normal">
              Clario predicts customer churn before it happens, giving your team actionable AI insights to retain high-value accounts.
            </p>

            {/* Pagination Dots */}
            <div className="flex items-center justify-center gap-1.5 mt-3">
              <div className="w-5 h-1.5 rounded-full bg-violet-500 transition-all" />
              <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
              <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
