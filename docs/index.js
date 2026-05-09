  const API_BASE = '/api';
  let jwtToken = null;
  let authMode = 'login';

  const $ = id => document.getElementById(id);
  const showMsg = (id, text, type) => {
    const el = $(id);
    if (!el) return;
    el.textContent = text;
    el.className = `msg ${type}`;
  };
  const clearMsg = id => {
    const el = $(id);
    if (!el) return;
    el.className = 'msg';
    el.textContent = '';
  };

  const setLoading = (btnId, loading) => {
    const btn = $(btnId);
    if (!btn) return;
    btn.disabled = loading;
  };

  const showView = id => {
    document.querySelectorAll('.card').forEach(c => c.classList.remove('active'));
    const view = $(id);
    if (view) view.classList.add('active');
  };

  const apiFetch = async (path, method, body, token) => {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`${API_BASE}${path}`, opts);
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Request failed');
    return data;
  };

  const initOtpInputs = () => {
    document.querySelectorAll('.otp-digit').forEach((inp, idx, all) => {
      inp.addEventListener('input', () => {
        if (inp.value && idx < all.length - 1) all[idx + 1].focus();
      });
      inp.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !inp.value && idx > 0) all[idx - 1].focus();
      });
      inp.addEventListener('paste', (e) => {
        const paste = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g,'').slice(0,6);
        [...paste].forEach((ch, i) => { if (all[i]) all[i].value = ch; });
        e.preventDefault();
      });
    });
  };

  const getOtpValue = () => [...document.querySelectorAll('.otp-digit')].map(i => i.value).join('');
  const clearOtpInputs = () => document.querySelectorAll('.otp-digit').forEach(i => i.value = '');

  function toggleAuthMode() {
    authMode = authMode === 'login' ? 'register' : 'login';
    $('authTitle').textContent = authMode === 'login' ? 'Log In' : 'Create Account';
    $('btnAuth').textContent = authMode === 'login' ? 'Log In' : 'Register';
    $('btnToggle').textContent = authMode === 'login' ? 'Create account' : 'Use existing account';
    $('fieldName').style.display = authMode === 'login' ? 'none' : 'flex';
  }

  async function doAuth() {
    clearMsg('msg-auth');
    const name = $('authName').value.trim();
    const email = $('authEmail').value.trim();
    const password = $('authPassword').value;

    if (!email || !password || (authMode === 'register' && !name)) {
      return showMsg('msg-auth','Please fill in all fields.','error');
    }

    setLoading('btnAuth', true);
    try {
      const path = authMode === 'register' ? '/auth/register' : '/auth/login';
      const body = authMode === 'register' ? { name, email, password } : { email, password };
      const data = await apiFetch(path, 'POST', body);
      jwtToken = data.token;
      showMsg('msg-auth', authMode === 'register' ? 'Registered successfully!' : 'Logged in successfully!','success');
      showView('view-phone');
    } catch (e) {
      showMsg('msg-auth', e.message, 'error');
    } finally {
      setLoading('btnAuth', false);
    }
  }

  async function doSendOTP() {
    clearMsg('msg-send');
    const phoneNumber = $('phoneInput').value.trim();
    if (!phoneNumber) return showMsg('msg-send','Please enter a phone number.','error');
    if (!jwtToken) return showMsg('msg-auth','Please log in first.','error');

    setLoading('btnSendOTP', true);
    try {
      await apiFetch('/verify/send-otp', 'POST', { phoneNumber }, jwtToken);
      showMsg('msg-send', 'OTP sent. Enter it below.', 'success');
      clearOtpInputs();
      showView('view-verify');
      document.querySelector('.otp-digit')?.focus();
    } catch (e) {
      showMsg('msg-send', e.message, 'error');
    } finally {
      setLoading('btnSendOTP', false);
    }
  }

  async function doVerifyOTP() {
    clearMsg('msg-verify');
    const otp = getOtpValue();
    if (otp.length < 6) return showMsg('msg-verify', 'Enter all 6 digits.','error');

    setLoading('btnVerify', true);
    try {
      const data = await apiFetch('/verify/verify-otp', 'POST', { otp }, jwtToken);
      $('successNote').textContent = `${data.user?.phoneNumber || 'Phone'} verified successfully.`;
      showView('view-success');
    } catch (e) {
      showMsg('msg-verify', e.message, 'error');
    } finally {
      setLoading('btnVerify', false);
    }
  }

  function doResend() {
    clearMsg('msg-send');
    clearMsg('msg-verify');
    showView('view-phone');
  }

  function resetFlow() {
    jwtToken = null;
    authMode = 'login';
    $('authTitle').textContent = 'Log In';
    $('btnAuth').textContent = 'Log In';
    $('btnToggle').textContent = 'Create account';
    $('fieldName').style.display = 'none';
    ['authName','authEmail','authPassword','phoneInput'].forEach(id => {
      const el = $(id);
      if (el) el.value = '';
    });
    clearOtpInputs();
    ['msg-auth','msg-send','msg-verify'].forEach(clearMsg);
    showView('view-auth');
  }

  document.addEventListener('DOMContentLoaded', () => {
    initOtpInputs();
    resetFlow();
  });