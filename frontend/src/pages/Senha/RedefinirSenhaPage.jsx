import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';

export default function RedefinirSenhaPage() {
  const [params] = useSearchParams();
  const [nova, setNova] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');

  async function salvar(e) {
    e.preventDefault();
    setErro('');
    if (nova !== confirmar) {
      setErro('As senhas não conferem.');
      return;
    }
    setEnviando(true);
    try {
      const r = await axiosClient.post('/auth/redefinir-senha/', {
        id: params.get('cnpj'),
        uid: params.get('uid'),
        token: params.get('token'),
        nova_senha: nova,
      });
      setMensagem(r.data.mensagem);
    } catch (err) {
      setErro(err.response?.data?.detail || 'Não foi possível redefinir a senha.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="d-flex align-items-center justify-content-center vh-100" style={{ background: '#1e2a38' }}>
      <div className="card shadow-lg border-0" style={{ width: '380px', borderRadius: '16px' }}>
        <div className="card-body p-4">
          <h4 className="fw-bold text-center mb-3" style={{ color: '#1e2a38' }}>Nova senha</h4>

          {mensagem ? (
            <>
              <div className="alert alert-success py-2 small">{mensagem}</div>
              <Link to="/login" className="btn btn-primary w-100">Ir para o login</Link>
            </>
          ) : (
            <form onSubmit={salvar}>
              {erro && <div className="alert alert-danger py-2 small">{erro}</div>}
              <div className="mb-3">
                <label className="form-label small fw-semibold">Nova senha (mínimo 8 caracteres)</label>
                <input type="password" className="form-control" required value={nova} onChange={(e) => setNova(e.target.value)} />
              </div>
              <div className="mb-3">
                <label className="form-label small fw-semibold">Confirmar nova senha</label>
                <input type="password" className="form-control" required value={confirmar} onChange={(e) => setConfirmar(e.target.value)} />
              </div>
              <button type="submit" className="btn btn-primary w-100 py-2 fw-semibold" disabled={enviando}>
                {enviando ? 'Salvando...' : 'Salvar nova senha'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
