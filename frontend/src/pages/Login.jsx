import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api, { errorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Logo, Spinner } from '../components/ui';

const DEMOS = [
  ['Super Admin', 'leela@lumen.cms', 'Leela#Lumen26'],
  ['Admin', 'rohan@lumen.cms', 'Rohan#Lumen26'],
  ['Editor', 'mira@lumen.cms', 'Mira#Lumen26'],
  ['Author', 'arun@lumen.cms', 'Arun#Lumen26'],
  ['Viewer', 'nila@lumen.cms', 'Nila#Lumen26'],
];

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [email, setEmail] = useState('leela@lumen.cms');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [openReg, setOpenReg] = useState(false);

  useEffect(() => {
    if (user) navigate(params.get('next') || '/admin', { replace: true });
  }, [user]);

  useEffect(() => {
    api.get('/auth/config').then((res) => setOpenReg(res.data.data.registrationEnabled)).catch(() => {});
  }, []);

  const submit = async (e, override) => {
    e?.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(override?.email || email, override?.password || password, remember);
      navigate(params.get('next') || '/admin');
    } catch (err) {
      setError(errorMessage(err, 'Could not sign in.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <section className="hidden flex-col justify-between bg-[#141210] p-10 text-[#f6f1e8] lg:flex">
        <Link to="/" className="flex items-center gap-2"><Logo className="h-8 w-8 text-[#fdba74]" /><span className="font-serif text-2xl">Lumen</span></Link>
        <div>
          <p className="font-serif text-5xl leading-[1.05]">The work of publishing is mostly the work of care.</p>
          <p className="mt-6 max-w-md text-sm leading-6 text-stone-400">Draft, review, schedule, and publish. The public journal shows only what the desk has released.</p>
        </div>
        <p className="text-xs uppercase tracking-[0.18em] text-stone-500">Local demonstration</p>
      </section>
      <section className="flex items-center justify-center bg-paper px-4 py-12">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-8 flex items-center gap-2 lg:hidden"><Logo className="h-7 w-7" /><span className="font-serif text-2xl">Lumen</span></Link>
          <h1 className="font-serif text-4xl">Sign in to the desk</h1>
          <p className="mt-2 text-sm text-stone-600">Use your email and password. Sessions expire unless you ask to be remembered.</p>
          <form className="mt-8 space-y-4" onSubmit={submit}>
            <label className="block"><span className="label">Email</span><input className="input" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
            <label className="block">
              <span className="label">Password</span>
              <div className="relative">
                <input className="input pr-16" type={show ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-500" onClick={() => setShow((v) => !v)}>{show ? 'Hide' : 'Show'}</button>
              </div>
            </label>
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> Remember me</label>
              <Link to="/forgot-password" className="text-copper">Forgot password</Link>
            </div>
            {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800" role="alert">{error}</p>}
            <button className="btn-primary w-full" disabled={busy}>{busy ? <Spinner /> : 'Sign in'}</button>
          </form>
          {openReg && <p className="mt-4 text-sm">Need an account? <Link to="/register" className="text-copper">Register</Link></p>}
          <div className="mt-8 rounded-2xl border border-line bg-white p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">Demo accounts · local use only</p>
            <div className="mt-3 space-y-2">
              {DEMOS.map(([role, mail, pass]) => (
                <button key={mail} type="button" className="flex w-full items-center justify-between rounded-lg border border-line px-3 py-2 text-left text-sm hover:border-copper" onClick={(e) => { setEmail(mail); setPassword(pass); submit(e, { email: mail, password: pass }); }}>
                  <span>{role}</span>
                  <span className="text-xs text-stone-500">{mail}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [link, setLink] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setMessage(data.message);
      setLink(data.data?.resetUrl || '');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <form className="card w-full max-w-md p-6" onSubmit={submit}>
        <h1 className="font-serif text-3xl">Reset a password</h1>
        <p className="mt-2 text-sm text-stone-600">Email is not configured in this demo. If demo mode is on, the reset link is shown here instead of being sent.</p>
        <label className="mt-5 block"><span className="label">Email</span><input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        {error && <p className="mt-3 text-sm text-rose-700">{error}</p>}
        {message && <p className="mt-3 text-sm text-stone-700">{message}</p>}
        {link && <Link className="mt-3 block text-sm text-copper" to={link}>Open reset page</Link>}
        <button className="btn-primary mt-5" disabled={busy}>{busy ? 'Sending…' : 'Create reset link'}</button>
        <Link to="/login" className="mt-4 block text-sm text-stone-500">Back to sign in</Link>
      </form>
    </div>
  );
}

export function ResetPassword() {
  const [params] = useSearchParams();
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await api.post('/auth/reset-password', { token: params.get('token'), password });
      setMessage(data.message);
      setTimeout(() => navigate('/login'), 900);
    } catch (err) {
      setError(errorMessage(err));
    }
  };
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <form className="card w-full max-w-md p-6" onSubmit={submit}>
        <h1 className="font-serif text-3xl">Choose a new password</h1>
        <label className="mt-5 block"><span className="label">New password</span><input className="input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        <p className="mt-2 text-xs text-stone-500">At least 8 characters, with an uppercase letter, a number, and a symbol.</p>
        {error && <p className="mt-3 text-sm text-rose-700">{error}</p>}
        {message && <p className="mt-3 text-sm text-emerald-800">{message}</p>}
        <button className="btn-primary mt-5">Update password</button>
      </form>
    </div>
  );
}

export function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [closed, setClosed] = useState(false);
  useEffect(() => {
    api.get('/auth/config').then((res) => { if (!res.data.data.registrationEnabled) setClosed(true); }).catch(() => {});
  }, []);
  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await api.post('/auth/register', form);
      localStorage.setItem('lumen_token', data.data.token);
      await login(form.email, form.password, true);
      navigate('/admin');
    } catch (err) {
      setError(errorMessage(err));
    }
  };
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <form className="card w-full max-w-md p-6" onSubmit={submit}>
        <h1 className="font-serif text-3xl">Request a desk account</h1>
        {closed ? <p className="mt-3 text-sm text-stone-600">Registration is closed. An administrator can open it in Settings, or create an account for you.</p> : (
          <div className="mt-5 space-y-3">
            <input className="input" placeholder="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className="input" type="email" placeholder="Email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <input className="input" type="password" placeholder="Password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            {error && <p className="text-sm text-rose-700">{error}</p>}
            <button className="btn-primary">Create account</button>
          </div>
        )}
        <Link to="/login" className="mt-4 block text-sm text-stone-500">Back to sign in</Link>
      </form>
    </div>
  );
}
