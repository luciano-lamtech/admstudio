import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function PlaceholderPage({ titulo, descricao, icone = 'bi-tools' }) {
  const navigate = useNavigate();
  return (
    <div className="text-center py-5">
      <i className={`bi ${icone}`} style={{ fontSize: '48px', color: '#94a3b8' }}></i>
      <h4 className="fw-bold mt-3">{titulo}</h4>
      <p className="text-muted">{descricao || 'Esta página ainda está em construção.'}</p>
      <button className="btn btn-outline-primary mt-2" onClick={() => navigate(-1)}>
        <i className="bi bi-arrow-left me-1"></i> Voltar
      </button>
    </div>
  );
}
