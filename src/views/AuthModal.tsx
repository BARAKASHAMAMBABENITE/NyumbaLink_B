import React, { useState } from 'react';
import {
  User,
  Lock,
  Mail,
  Phone,
  Building2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff
} from 'lucide-react';
import { UserProfile } from '../types';
import { BrandLogo } from '../components/BrandLogo';
import {
  loginUser,
  registerUser,
  loginWithGoogle,
  sendMagicLink,
  resetUserPassword,
  isValidEmail,
  isValidPassword
} from '../services/authService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  setUser: (user: UserProfile | null) => void;
  noticeMessage?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  setUser,
  noticeMessage
}) => {
  if (!isOpen) return null;

  const [mode, setMode] = useState<'login' | 'register' | 'magic' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullname, setFullname] = useState('');
  const [phone, setPhone] = useState('');
  
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const profile = await loginWithGoogle();
      setUser(profile);
      onClose();
    } catch (err: any) {
      console.error('Google Auth Error:', err);
      setErrorMsg(err?.message || 'Erreur lors de la connexion Google.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!isValidEmail(cleanEmail)) {
      setErrorMsg('Veuillez saisir une adresse e-mail valide.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await sendMagicLink(cleanEmail);
      setMagicLinkSent(true);
      setSuccessMsg(`Lien généré pour : ${cleanEmail}`);
    } catch (err: any) {
      console.error('Magic link error:', err);
      setErrorMsg(err?.message || 'Erreur lors de l’envoi du lien.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitStandard = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    const cleanPass = password.trim();

    if (!isValidEmail(cleanEmail)) {
      setErrorMsg('Veuillez saisir une adresse e-mail valide (ex: contact@gmail.com).');
      return;
    }

    if (mode === 'register') {
      if (!fullname.trim() || fullname.trim().length < 2) {
        setErrorMsg('Veuillez renseigner votre nom complet.');
        return;
      }
      if (!isValidPassword(cleanPass)) {
        setErrorMsg('Le mot de passe doit comporter au moins 8 caractères.');
        return;
      }
    } else if (mode === 'login') {
      if (!cleanPass) {
        setErrorMsg('Veuillez renseigner votre mot de passe.');
        return;
      }
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (mode === 'login') {
        const profile = await loginUser(cleanEmail, cleanPass);
        setUser(profile);
        onClose();
      } else if (mode === 'register') {
        const profile = await registerUser(cleanEmail, cleanPass, fullname.trim(), 'client', phone.trim());
        setUser(profile);
        onClose();
      } else if (mode === 'forgot') {
        await resetUserPassword(cleanEmail);
        setSuccessMsg('Un e-mail de réinitialisation de mot de passe vous a été envoyé.');
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setErrorMsg(err?.message || 'Erreur d’authentification.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-slate-900/70 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1e1e1e] rounded-3xl max-w-md w-full max-h-[calc(100vh-1.5rem)] sm:max-h-[90vh] overflow-y-auto my-auto p-6 sm:p-7 pb-8 shadow-2xl border border-slate-100 dark:border-[#2e2e2e] relative">
        {/* Decorative top bar */}
        <div className="sticky -top-6 sm:-top-7 -mx-6 sm:-mx-7 mb-4 h-1.5 bg-[#FF385C] z-10"></div>

        {/* Modal Header */}
        <div className="text-center mb-6 pt-2 flex flex-col items-center">
          <div className="mb-3">
            <BrandLogo size="lg" showText={false} />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            {mode === 'register'
              ? 'Créer un Compte Sécurisé'
              : mode === 'forgot'
              ? 'Mot de Passe Oublié'
              : 'Connexion à NyumbaLink'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Immobilier Certifié • Bukavu
          </p>
        </div>

        {/* Mode Tabs */}
        {mode !== 'forgot' && (
          <div className="flex rounded-xl bg-slate-100 dark:bg-[#121212] p-1 mb-5 text-xs font-bold border border-slate-200 dark:border-[#2e2e2e]">
            <button
              onClick={() => {
                setMode('login');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`flex-1 py-2 rounded-lg transition flex items-center justify-center space-x-1 cursor-pointer ${
                mode === 'login'
                  ? 'bg-white dark:bg-[#252525] text-[#FF385C] shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Se Connecter</span>
            </button>

            <button
              onClick={() => {
                setMode('register');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`flex-1 py-2 rounded-lg transition flex items-center justify-center space-x-1 cursor-pointer ${
                mode === 'register'
                  ? 'bg-white dark:bg-[#252525] text-[#FF385C] shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>S'inscrire</span>
            </button>

            <button
              onClick={() => {
                setMode('magic');
                setMagicLinkSent(false);
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`flex-1 py-2 rounded-lg transition flex items-center justify-center space-x-1 cursor-pointer ${
                mode === 'magic'
                  ? 'bg-white dark:bg-[#252525] text-[#FF385C] shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Lien E-mail</span>
            </button>
          </div>
        )}

        {/* Google Login Button */}
        {mode !== 'forgot' && (
          <div className="mb-5">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full bg-white dark:bg-[#151515] hover:bg-slate-50 dark:hover:bg-[#222] text-slate-700 dark:text-slate-200 font-bold py-2.5 px-4 rounded-xl text-xs border border-slate-200 dark:border-[#2e2e2e] hover:border-slate-300 transition shadow-xs flex items-center justify-center space-x-3 group cursor-pointer"
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
              <span>Continuer avec Google</span>
            </button>

            <div className="relative flex py-3 items-center">
              <div className="flex-grow border-t border-slate-200 dark:border-[#2e2e2e]"></div>
              <span className="shrink-0 mx-3 text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                ou par identifiants
              </span>
              <div className="flex-grow border-t border-slate-200 dark:border-[#2e2e2e]"></div>
            </div>
          </div>
        )}

        {/* Notice Message if prompted by restricted action */}
        {noticeMessage && (
          <div className="mb-4 bg-[#FF385C]/10 border border-[#FF385C]/30 text-[#FF385C] text-xs p-3.5 rounded-2xl flex items-start space-x-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-[#FF385C] shrink-0 mt-0.5" />
            <span className="font-bold leading-relaxed">{noticeMessage}</span>
          </div>
        )}

        {/* Error / Success Messages */}
        {errorMsg && (
          <div className="mb-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs p-3.5 rounded-xl flex items-start space-x-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <span className="font-medium">{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs p-3 rounded-xl flex items-start space-x-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">{successMsg}</p>
            </div>
          </div>
        )}

        {/* MODE 1: Magic Link */}
        {mode === 'magic' && (
          <div className="space-y-4">
            {!magicLinkSent ? (
              <form onSubmit={handleSendMagicLink} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Adresse e-mail
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="ben@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2e2e2e] rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:bg-white dark:focus:bg-[#151515] focus:ring-2 focus:ring-[#FF385C] focus:outline-hidden"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#FF385C] hover:opacity-90 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-md flex items-center justify-center space-x-2 cursor-pointer"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      <span>Envoyer le lien de connexion sécurisé</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="space-y-3 pt-2 text-center">
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl space-y-2 text-left">
                  <div className="flex items-center space-x-2 text-emerald-700 dark:text-emerald-300 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Lien d'accès envoyé</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                    Un e-mail contenant votre lien de connexion sécurisé a été envoyé à <strong>{email}</strong>. Veuillez vérifier votre boîte de réception pour vous connecter.
                  </p>
                </div>

                <button
                  onClick={() => setMagicLinkSent(false)}
                  className="w-full text-center text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white underline cursor-pointer pt-1"
                >
                  Saisir une autre adresse e-mail
                </button>
              </div>
            )}
          </div>
        )}

        {/* MODE 2: Registration */}
        {mode === 'register' && (
          <form onSubmit={handleSubmitStandard} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nom Complet
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="BARAKA SHAMAMBA BENITE"
                  value={fullname}
                  onChange={(e) => setFullname(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2e2e2e] rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:bg-white dark:focus:bg-[#151515] focus:ring-2 focus:ring-[#FF385C] focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Adresse E-mail
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="ben@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2e2e2e] rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:bg-white dark:focus:bg-[#151515] focus:ring-2 focus:ring-[#FF385C] focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Mot de Passe (min. 8 caractères)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2e2e2e] rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:bg-white dark:focus:bg-[#151515] focus:ring-2 focus:ring-[#FF385C] focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-white transition cursor-pointer"
                  title={showPassword ? 'Masquer' : 'Afficher'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Numéro de Téléphone / WhatsApp
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="tel"
                  placeholder="+24398676017"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2e2e2e] rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:bg-white dark:focus:bg-[#151515] focus:ring-2 focus:ring-[#FF385C]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FF385C] hover:opacity-90 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-md flex items-center justify-center space-x-2 mt-2 cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <span>Créer mon Compte</span>
              )}
            </button>
          </form>
        )}

        {/* MODE 3: Password Login */}
        {(mode === 'login' || mode === 'forgot') && (
          <form onSubmit={handleSubmitStandard} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Adresse E-mail
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="ben@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2e2e2e] rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:bg-white dark:focus:bg-[#151515] focus:ring-2 focus:ring-[#FF385C] focus:outline-hidden"
                />
              </div>
            </div>

            {mode === 'login' && (
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Mot de passe
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setErrorMsg('');
                      setSuccessMsg('');
                    }}
                    className="text-[11px] text-[#FF385C] hover:underline font-semibold cursor-pointer"
                  >
                    Mot de passe oublié ?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2e2e2e] rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:bg-white dark:focus:bg-[#151515] focus:ring-2 focus:ring-[#FF385C] focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-white transition cursor-pointer"
                    title={showPassword ? 'Masquer' : 'Afficher'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FF385C] hover:opacity-90 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-md flex items-center justify-center space-x-2 cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <span>{mode === 'login' ? 'Se Connecter' : 'Réinitialiser le Mot de Passe'}</span>
              )}
            </button>

            {mode === 'forgot' && (
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className="w-full text-center text-xs text-slate-500 dark:text-slate-400 hover:underline pt-2 cursor-pointer"
              >
                Retour à la connexion
              </button>
            )}
          </form>
        )}

        {/* Footer Cancel Button */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-[#2e2e2e] flex justify-center">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-[#2e2e2e] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-[#252525] font-bold text-xs transition text-center cursor-pointer"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
};
