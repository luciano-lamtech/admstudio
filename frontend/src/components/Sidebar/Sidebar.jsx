import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar() {
  const { menu, tenant } = useAuth();

  return (
    <aside className="d-flex flex-column bg-dark text-white p-3" style={{ width: '250px', minHeight: '100vh' }}>
      <div className="mb-4 px-2">
        <h4 className="fw-bold mb-0">ADM<span className="text-primary">STUDIO</span></h4>
        {tenant && <small className="text-secondary">{tenant.nome}</small>}
      </div>

      <nav className="flex-grow-1">
        <ul className="nav nav-pills flex-column gap-1">
          {menu.map((item) => (
            <li className="nav-item" key={item.id || item.rota}>
              <NavLink
                to={item.rota}
                className={({ isActive }) =>
                  'nav-link text-white d-flex align-items-center gap-2' + (isActive ? ' active' : '')
                }
              >
                <i className={`bi ${item.icone || 'bi-circle'}`}></i>
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
