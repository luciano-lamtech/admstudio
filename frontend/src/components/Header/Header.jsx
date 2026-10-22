import React, { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';
import { unidadeAtual, setUnidadeAtual } from '../../utils/unidade';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

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

  return (
    <header className="d-flex justify-content-between align-items-center bg-white border-bottom px-4 py-3">
      <div className="d-flex align-items-center gap-3">
        <div className="text-muted small text-capitalize">{hoje}</div>
        {unidades.length > 0 && (
          <select className="form-select form-select-sm w-auto" value={unidadeAtual()}
            onChange={(e) => { setUnidadeAtual(e.target.value); window.location.reload(); }}>
            {unidades.length > 1 && <option value="">Todas as unidades</option>}
            {unidades.map((u) => <option key={u.id} value={u.id}>{u.nome_empresa}</option>)}
          </select>
        )}
      </div>
      <div className="dropdown">
        <button
          className="btn btn-light d-flex align-items-center gap-2 dropdown-toggle"
          type="button"
          data-bs-toggle="dropdown"
        >
          <i className="bi bi-person-circle fs-5"></i>
          <span className="small fw-semibold">{user?.nome}</span>
        </button>
        <ul className="dropdown-menu dropdown-menu-end">
          <li><span className="dropdown-item-text small text-muted">{user?.role?.nome}</span></li>
          <li><hr className="dropdown-divider" /></li>
          <li>
            <button className="dropdown-item text-danger" onClick={handleLogout}>
              <i className="bi bi-box-arrow-right me-2"></i>Sair
            </button>
          </li>
        </ul>
      </div>
    </header>
  );
}
