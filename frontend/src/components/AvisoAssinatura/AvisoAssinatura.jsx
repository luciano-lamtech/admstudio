import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';

export default function AvisoAssinatura() {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    axiosClient.get('/assinatura/')
      .then((r) => setStatus(r.data.sem_assinatura ? null : r.data.status_cobranca))
      .catch(() => {});
  }, []);

  if (status !== 'devedor') return null;

  return (
    <div className="alert alert-warning mb-0 rounded-0 py-2 px-4 small d-flex justify-content-between align-items-center">
      <span>
        <i className="bi bi-exclamation-triangle me-2"></i>
        Identificamos uma mensalidade em atraso. Regularize o boleto para evitar o bloqueio do acesso.
      </span>
      <Link to="/configuracoes/assinatura" className="btn btn-sm btn-warning">Ver assinatura</Link>
    </div>
  );
}
