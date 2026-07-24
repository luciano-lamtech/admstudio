import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [id, setId] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    try {
      await login(email, senha, id);
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.detail || 'Não foi possível entrar. Verifique os dados.';
      setErro(msg);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="d-flex align-items-center justify-content-center vh-100" style={{ background: '#1e2a38' }}>
      <div className="card shadow-lg border-0" style={{ width: '380px', borderRadius: '16px' }}>
        <div className="card-body p-4">
          <div className="text-center mb-4">
            <div className="d-flex align-items-center justify-content-center gap-2">
              <svg width="40" height="40" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <polygon points="24,8 24,24 10.14,16" fill="#3b82f6" />
                <polygon points="24,8 37.86,16 24,24" fill="#fbbf24" />
                <polygon points="10.14,16 24,24 24,40 10.14,32" fill="#f4645c" />
                <polygon points="24,24 37.86,16 37.86,32 24,40" fill="#f4645c" />
              </svg>
              <h2 className="fw-bold mb-0" style={{ color: '#1e2a38' }}>ADM<span className="text-primary">STUDIO</span></h2>
            </div>
          </div>

          {erro && <div className="alert alert-danger py-2 small">{erro}</div>}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label small fw-semibold">E-mail</label>
              <input
                type="email"
                className="form-control"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label small fw-semibold">Senha</label>
              <input
                type="password"
                className="form-control"
                placeholder="••••••••"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
              />
            </div>

            <div className="mb-4">
              <label className="form-label small fw-semibold">CNPJ ou CPF (identificação do assinante)</label>
              <input
                type="text"
                inputMode="numeric"
                className="form-control"
                placeholder="Somente números"
                value={id}
                onChange={(e) => setId(e.target.value.replace(/\D/g, '').slice(0, 14))}
                maxLength={14}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary w-100 py-2 fw-semibold" disabled={carregando}>
              {carregando ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
