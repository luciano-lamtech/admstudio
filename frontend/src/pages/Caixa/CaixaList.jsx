import React, { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';

const FORMAS_PAGAMENTO = [
  { valor: 'dinheiro', label: 'Dinheiro' },
  { valor: 'pix', label: 'Pix' },
  { valor: 'cartao_credito', label: 'Cartão de Crédito' },
  { valor: 'cartao_debito', label: 'Cartão de Débito' },
  { valor: 'outro', label: 'Outro' },
];

function ModalPix({ pendencia, onFechar }) {
  const [imagens, setImagens] = useState({});
  const itens = pendencia.itens_agendamento || [];

  useEffect(() => {
    itens.filter((i) => i.tem_qrcode).forEach((i) => {
      axiosClient.get(`/catalogo/${i.item_id}/qrcode/`)
        .then((r) => setImagens((m) => ({ ...m, [i.item_id]: r.data.imagem })))
        .catch(() => {});
    });
  }, [pendencia]); // eslint-disable-line

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1060 }} onClick={onFechar}>
      <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title fw-bold">Pagamento via Pix</h5>
            <button className="btn-close" onClick={onFechar}></button>
          </div>
          <div className="modal-body">
            <div className="small text-muted mb-3">{pendencia.descricao}</div>
            {itens.length === 0 && (
              <div className="text-center text-muted">Esta pendência não tem itens de agendamento.</div>
            )}
            {itens.map((i) => (
              <div key={i.item_id} className="border rounded p-3 mb-2 text-center">
                <div className="fw-semibold">{i.nome}{i.quantidade > 1 ? ` x${i.quantidade}` : ''}</div>
                <div className="small mb-2">R$ {parseFloat(i.preco).toFixed(2).replace('.', ',')}</div>
                {!i.tem_qrcode && <div className="small text-danger">QR Code não cadastrado para este item.</div>}
                {i.tem_qrcode && !imagens[i.item_id] && <div className="small text-muted">Carregando QR Code...</div>}
                {i.tem_qrcode && imagens[i.item_id] && (
                  <img src={imagens[i.item_id]} alt={`QR ${i.nome}`} className="img-fluid" style={{ maxWidth: 240 }} />
                )}
              </div>
            ))}
          </div>
          <div className="modal-footer">
            <button className="btn btn-primary" onClick={onFechar}>Fechar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CaixaList() {
  const [pendencias, setPendencias] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [pendenciaSelecionada, setPendenciaSelecionada] = useState(null);
  const [formaPagamento, setFormaPagamento] = useState('dinheiro');
  const [processando, setProcessando] = useState(false);
  const [mostrarPix, setMostrarPix] = useState(false);

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

      {mostrarPix && pendenciaSelecionada && (
        <ModalPix pendencia={pendenciaSelecionada} onFechar={() => setMostrarPix(false)} />
      )}

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
                    onChange={(e) => {
                      setFormaPagamento(e.target.value);
                      if (e.target.value === 'pix') setMostrarPix(true);
                    }}>
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
