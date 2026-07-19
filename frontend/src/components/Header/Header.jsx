import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <header className="d-flex justify-content-between align-items-center bg-white border-bottom px-4 py-3">
      <div />
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
