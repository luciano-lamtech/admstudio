import React, { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';

const FORMAS_PAGAMENTO = [
  { valor: 'dinheiro', label: 'Dinheiro' },
  { valor: 'pix', label: 'Pix' },
  { valor: 'cartao_credito', label: 'Cartão de Crédito' },
  { valor: 'cartao_debito', label: 'Cartão de Débito' },
  { valor: 'outro', label: 'Outro' },
];

export default function CaixaList() {
  const [pendencias, setPendencias] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [pendenciaSelecionada, setPendenciaSelecionada] = useState(null);
  const [formaPagamento, setFormaPagamento] = useState('dinheiro');
  const [processando, setProcessando] = useState(false);

  async function carregar() {
    const res = await axiosClient.get('/financeiro/', {
      params: { status: 'pendente', tipo: 'receita' },
    });
    setPendencias(res.data.results || res.data);
  }

  useEffect(() => { carregar(); }, []);

  const totalPendente = pendencias.reduce((s, p) => s + parseFloat(p.valor), 0);

  function abrirRecebimento(pendencia) {
    setPendenciaSelecionada(pendencia);
    setFormaPagamento(pendencia.forma_pagamento || 'dinheiro');
    setMostrarModal(true);
  }

  async function confirmarRecebimento(e) {
    e.preventDefault();
    setProcessando(true);
    try {
      await axiosClient.post(`/financeiro/${pendenciaSelecionada.id}/receber/`, {
        forma_pagamento: formaPagamento,
      });
      setMostrarModal(false);
      carregar();
    } finally {
      setProcessando(false);
    }
  }

  return (
    <div>
      <h3 className="fw-bold mb-3">Caixa</h3>

      {/* Contador */}
      <div className="bg-dark text-white rounded-3 px-4 py-3 mb-3 d-flex align-items-center justify-content-between flex-wrap gap-2">
        <div className="d-flex align-items-center gap-2">
          <i className="bi bi-cash-stack fs-5"></i>
          <span className="fw-bold fs-5">{pendencias.length}</span>
          <span className="text-white-50">PENDENTES DE RECEBIMENTO</span>
        </div>
        <div className="fw-bold fs-5">
          Total: R$ {totalPendente.toFixed(2).replace('.', ',')}
        </div>
      </div>

      {/* Tabela */}
      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead style={{ backgroundColor: '#1e2a5e' }}>
              <tr className="text-white">
                <th className="py-3 ps-3">DATA</th>
                <th className="py-3">CLIENTE / DESCRIÇÃO</th>
                <th className="py-3">VALOR</th>
                <th className="py-3 text-end pe-3">AÇÃO</th>
              </tr>
            </thead>
            <tbody>
              {pendencias.map((p) => (
                <tr key={p.id}>
                  <td className="ps-3">{new Date(p.data + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                  <td className="fw-semibold">
                    {p.descricao}
                    {p.cliente_nome && <div className="small text-muted">Cliente: {p.cliente_nome}</div>}
                  </td>
                  <td className="fw-bold">R$ {parseFloat(p.valor).toFixed(2).replace('.', ',')}</td>
                  <td className="text-end pe-3">
                    <button className="btn btn-sm btn-success" onClick={() => abrirRecebimento(p)}>
                      <i className="bi bi-check-lg me-1"></i> Receber
                    </button>
                  </td>
                </tr>
              ))}
              {pendencias.length === 0 && (
                <tr><td colSpan="4" className="text-center text-muted py-4">Nenhuma pendência de recebimento no momento.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de recebimento */}
      {mostrarModal && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setMostrarModal(false)}>
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Receber Pagamento</h5>
                <button className="btn-close" onClick={() => setMostrarModal(false)}></button>
              </div>
              <form onSubmit={confirmarRecebimento}>
                <div className="modal-body">
                  <p className="mb-1">{pendenciaSelecionada?.descricao}</p>
                  <p className="fs-4 fw-bold mb-3">
                    R$ {parseFloat(pendenciaSelecionada?.valor || 0).toFixed(2).replace('.', ',')}
                  </p>
                  <label className="form-label small">Forma de Pagamento</label>
                  <select className="form-select" value={formaPagamento}
                    onChange={(e) => setFormaPagamento(e.target.value)}>
                    {FORMAS_PAGAMENTO.map((f) => <option key={f.valor} value={f.valor}>{f.label}</option>)}
                  </select>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setMostrarModal(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-success" disabled={processando}>
                    {processando ? 'Confirmando...' : 'Confirmar Recebimento'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
