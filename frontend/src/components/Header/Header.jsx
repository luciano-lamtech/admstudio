import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { unidadeAtual, setUnidadeAtual } from '../../utils/unidade';
import { useAuth } from '../../context/AuthContext';

const ALTURA = 38;

const hoje = new Date().toLocaleDateString('pt-BR', {
  weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
});

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unidades, setUnidades] = useState([]);

  useEffect(() => {
    axiosClient.get('/negocio/')
      .then((r) => {
        const lista = r.data.results || r.data;
        setUnidades(lista);
        // Usuário com uma única unidade liberada: seleciona automaticamente
        if (lista.length === 1 && !unidadeAtual()) setUnidadeAtual(lista[0].id);
      })
      .catch(() => {});
  }, []);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  function mascararEmail(email) {
    const [nome, dominio] = (email || '').split('@');
    if (!dominio) return email || '';
    return `${nome.slice(0, 2)}${'*'.repeat(Math.max(nome.length - 2, 1))}@${dominio}`;
  }

  async function handleEsqueciSenha() {
    const destino = mascararEmail(user?.email);
    if (!window.confirm(`Enviar um link para ${destino} para alterar sua senha?`)) return;
    try {
      const r = await axiosClient.post('/auth/meu-link-senha/');
      window.alert(r.data.mensagem);
    } catch (err) {
      window.alert(err.response?.data?.detail || 'Não foi possível enviar o link.');
    }
  }

  return (
    <header className="d-flex justify-content-between align-items-center bg-white border-bottom px-4 py-3">
      <div className="text-muted small text-capitalize">{hoje}</div>

      <div className="d-flex align-items-center gap-2">
        {unidades.length > 0 && (
          <select
            className="form-select w-auto"
            style={{ height: ALTURA, minWidth: 200 }}
            value={unidadeAtual()}
            onChange={(e) => { setUnidadeAtual(e.target.value); window.location.reload(); }}
          >
            {unidades.length > 1 && <option value="">Todas as unidades</option>}
            {unidades.map((u) => <option key={u.id} value={u.id}>{u.nome_unidade || u.nome_empresa}</option>)}
          </select>
        )}

        <div className="dropdown">
          <button
            className="btn btn-light d-flex align-items-center gap-2 dropdown-toggle"
            type="button"
            data-bs-toggle="dropdown"
            style={{ height: ALTURA }}
          >
            <i className="bi bi-person-circle fs-5"></i>
            <span className="small fw-semibold">{user?.nome}</span>
          </button>
          <ul className="dropdown-menu dropdown-menu-end">
            <li><span className="dropdown-item-text small text-muted">{user?.role?.nome}</span></li>
            <li><hr className="dropdown-divider" /></li>
            <li>
              <button className="dropdown-item" onClick={handleEsqueciSenha}>
                <i className="bi bi-key me-2"></i>Alterar a senha
              </button>
            </li>
            <li>
              <button className="dropdown-item text-danger" onClick={handleLogout}>
                <i className="bi bi-box-arrow-right me-2"></i>Sair
              </button>
            </li>
          </ul>
        </div>
      </div>
    </header>
  );
}
