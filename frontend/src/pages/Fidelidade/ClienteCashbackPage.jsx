import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';

function formatarData(iso) {
  return iso ? new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR') : '—';
}

function reais(valor) {
  return `R$ ${parseFloat(valor).toFixed(2).replace('.', ',')}`;
}

export default function ClienteCashbackPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cliente, setCliente] = useState(null);
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    axiosClient.get(`/clientes/${id}/`).then((r) => setCliente(r.data)).catch(() => setErro('Cliente não encontrado.'));
    axiosClient.get(`/fidelidade/clientes/${id}/`)
      .then((r) => setDados(r.data))
      .catch(() => setErro('Não foi possível carregar o cashback.'));
  }, [id]);

  return (
    <div>
      <button className="btn btn-link text-decoration-none ps-0 mb-2" onClick={() => navigate(`/clientes/${id}/historico`)}>
        <i className="bi bi-arrow-left me-1"></i> Histórico
      </button>

      <h3 className="fw-bold mb-0">Cashback</h3>
      <div className="text-muted mb-3">{cliente?.nome}</div>

      {erro && <div className="alert alert-danger py-2 small">{erro}</div>}

      {dados && !dados.ativo && (
        <div className="alert alert-warning py-2 small">
          O programa de cashback está desativado. Ative em Gestão → Fidelidade / Cashback.
        </div>
      )}

      {dados && (
        <>
          <div className="card border-0 shadow-sm mb-3" style={{ backgroundColor: '#d5f2df', borderRadius: '10px', maxWidth: 360 }}>
            <div className="card-body text-center">
              <div className="text-uppercase small fw-semibold mb-1 opacity-75">Saldo disponível</div>
              <div className="fs-2 fw-bold">{reais(dados.saldo)}</div>
            </div>
          </div>

          <div className="card border-0 shadow-sm">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead style={{ backgroundColor: '#1e2a5e' }}>
                  <tr className="text-white">
                    <th className="py-3 ps-3">DATA</th>
                    <th className="py-3">MOVIMENTO</th>
                    <th className="py-3">VALOR</th>
                    <th className="py-3 pe-3">VÁLIDO ATÉ</th>
                  </tr>
                </thead>
                <tbody>
                  {dados.movimentos.map((m) => (
                    <tr key={m.id}>
                      <td className="ps-3">{formatarData(m.data)}</td>
                      <td>{m.descricao || (m.tipo === 'credito' ? 'Crédito' : 'Uso')}</td>
                      <td className={m.tipo === 'credito' ? 'text-success fw-semibold' : 'text-danger fw-semibold'}>
                        {m.tipo === 'credito' ? '+' : '-'} {reais(m.valor)}
                      </td>
                      <td className="pe-3">{m.tipo === 'credito' ? formatarData(m.validade_ate) : '—'}</td>
                    </tr>
                  ))}
                  {dados.movimentos.length === 0 && (
                    <tr><td colSpan="4" className="text-center text-muted py-4">Nenhum movimento de cashback.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
