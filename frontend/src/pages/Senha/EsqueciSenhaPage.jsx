import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';

export default function EsqueciSenhaPage() {
  const [id, setId] = useState('');
  const [email, setEmail] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');

  async function enviar(e) {
    e.preventDefault();
    setEnviando(true);
    setErro('');
    try {
      const r = await axiosClient.post('/auth/esqueci-senha/', { id, email });
      setMensagem(r.data.mensagem);
    } catch {
      setErro('Não foi possível enviar agora. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="d-flex align-items-center justify-content-center vh-100" style={{ background: '#1e2a38' }}>
      <div className="card shadow-lg border-0" style={{ width: '380px', borderRadius: '16px' }}>
        <div className="card-body p-4">
          <h4 className="fw-bold text-center mb-3" style={{ color: '#1e2a38' }}>Esqueci minha senha</h4>

          {mensagem ? (
            <>
              <div className="alert alert-success py-2 small">{mensagem}</div>
              <Link to="/login" className="btn btn-primary w-100">Voltar ao login</Link>
            </>
          ) : (
            <form onSubmit={enviar}>
              {erro && <div className="alert alert-danger py-2 small">{erro}</div>}
              <div className="mb-3">
                <label className="form-label small fw-semibold">CNPJ ou CPF do estabelecimento</label>
                <input className="form-control" required inputMode="numeric" value={id}
                  onChange={(e) => setId(e.target.value.replace(/\D/g, '').slice(0, 14))} />
              </div>
              <div className="mb-3">
                <label className="form-label small fw-semibold">E-mail da conta</label>
                <input type="email" className="form-control" required value={email}
                  onChange={(e) => setEmail(e.target.value)} />
              </div>
              <button type="submit" className="btn btn-primary w-100 py-2 fw-semibold" disabled={enviando}>
                {enviando ? 'Enviando...' : 'Enviar link'}
              </button>
              <div className="text-center mt-3 small"><Link to="/login">Voltar ao login</Link></div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
