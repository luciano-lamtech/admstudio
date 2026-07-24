import React, { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';

function primeiroDiaMes() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}
function hojeISO() {
  return new Date().toISOString().slice(0, 10);
}

const LANCAMENTO_VAZIO = {
  tipo: 'receita', categoria: '', descricao: '', valor: '',
  forma_pagamento: 'dinheiro', status: 'pago', data: hojeISO(), observacoes: '',
};

const FORMAS_PAGAMENTO = [
  { valor: 'dinheiro', label: 'Dinheiro' },
  { valor: 'pix', label: 'Pix' },
  { valor: 'cartao_credito', label: 'Cartão de Crédito' },
  { valor: 'cartao_debito', label: 'Cartão de Débito' },
  { valor: 'outro', label: 'Outro' },
];

export default function FinanceiroList() {
  const [lancamentos, setLancamentos] = useState([]);
  const [dataInicio, setDataInicio] = useState(primeiroDiaMes());
  const [dataFim, setDataFim] = useState(hojeISO());
  const [tipoFiltro, setTipoFiltro] = useState('todos');

  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState(LANCAMENTO_VAZIO);
  const [editandoId, setEditandoId] = useState(null);
  const [salvando, setSalvando] = useState(false);

  async function carregar() {
    const params = { data_inicio: dataInicio || undefined, data_fim: dataFim || undefined };
    if (tipoFiltro !== 'todos') params.tipo = tipoFiltro;
    const res = await axiosClient.get('/financeiro/', { params });
    setLancamentos(res.data.results || res.data);
  }

  useEffect(() => { carregar(); }, [dataInicio, dataFim, tipoFiltro]); // eslint-disable-line

  const totalReceitas = lancamentos.filter((l) => l.tipo === 'receita').reduce((s, l) => s + parseFloat(l.valor), 0);
  const totalDespesas = lancamentos.filter((l) => l.tipo === 'despesa').reduce((s, l) => s + parseFloat(l.valor), 0);
  const saldo = totalReceitas - totalDespesas;

  function abrirNovo() {
    setForm({ ...LANCAMENTO_VAZIO, data: hojeISO() });
    setEditandoId(null);
    setMostrarForm(true);
  }

  function editar(l) {
    setForm({
      tipo: l.tipo, categoria: l.categoria || '', descricao: l.descricao, valor: l.valor,
      forma_pagamento: l.forma_pagamento, status: l.status, data: l.data, observacoes: l.observacoes || '',
    });
    setEditandoId(l.id);
    setMostrarForm(true);
  }

  async function salvar(e) {
    e.preventDefault();
    setSalvando(true);
    try {
      const payload = { ...form, valor: parseFloat(form.valor) || 0 };
      if (editandoId) {
        await axiosClient.put(`/financeiro/${editandoId}/`, payload);
      } else {
        await axiosClient.post('/financeiro/', payload);
      }
      setMostrarForm(false);
      carregar();
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(id) {
    if (!window.confirm('Deseja realmente excluir este lançamento?')) return;
    await axiosClient.delete(`/financeiro/${id}/`);
    carregar();
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="fw-bold mb-0">Financeiro</h3>
        <button className="btn btn-primary" onClick={abrirNovo}>
          <i className="bi bi-plus-lg me-1"></i> Novo Lançamento
        </button>
      </div>

      {/* Cards de resumo */}
      <div className="row row-cols-1 row-cols-md-3 g-3 mb-3">
        <div className="col">
          <div className="card border-0 shadow-sm h-100" style={{ backgroundColor: '#d5f2df', borderRadius: '10px' }}>
            <div className="card-body text-center">
              <div className="text-uppercase small fw-semibold mb-1 opacity-75">Receitas</div>
              <div className="fs-3 fw-bold">R$ {totalReceitas.toFixed(2).replace('.', ',')}</div>
            </div>
          </div>
        </div>
        <div className="col">
          <div className="card border-0 shadow-sm h-100" style={{ backgroundColor: '#fbdada', borderRadius: '10px' }}>
            <div className="card-body text-center">
              <div className="text-uppercase small fw-semibold mb-1 opacity-75">Despesas</div>
              <div className="fs-3 fw-bold">R$ {totalDespesas.toFixed(2).replace('.', ',')}</div>
            </div>
          </div>
        </div>
        <div className="col">
          <div className="card border-0 shadow-sm h-100" style={{ backgroundColor: '#d6eaf8', borderRadius: '10px' }}>
            <div className="card-body text-center">
              <div className="text-uppercase small fw-semibold mb-1 opacity-75">Saldo</div>
              <div className="fs-3 fw-bold">R$ {saldo.toFixed(2).replace('.', ',')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="d-flex gap-2 mb-3 flex-wrap">
        <input type="date" className="form-control w-auto" value={dataInicio}
          onChange={(e) => setDataInicio(e.target.value)} />
        <input type="date" className="form-control w-auto" value={dataFim}
          onChange={(e) => setDataFim(e.target.value)} />
        <select className="form-select w-auto" value={tipoFiltro} onChange={(e) => setTipoFiltro(e.target.value)}>
          <option value="todos">Todos</option>
          <option value="receita">Receitas</option>
          <option value="despesa">Despesas</option>
        </select>
      </div>

      {/* Tabela */}
      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead style={{ backgroundColor: '#1e2a5e' }}>
              <tr className="text-white">
                <th className="py-3 ps-3">DATA</th>
                <th className="py-3">DESCRIÇÃO</th>
                <th className="py-3">CATEGORIA</th>
                <th className="py-3">TIPO</th>
                <th className="py-3">VALOR</th>
                <th className="py-3">STATUS</th>
                <th className="py-3 text-end pe-3">AÇÕES</th>
              </tr>
            </thead>
            <tbody>
              {lancamentos.map((l) => (
                <tr key={l.id}>
                  <td className="ps-3">{new Date(l.data + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                  <td className="fw-semibold">
                    {l.descricao}
                    {l.cliente_nome && <div className="small text-muted">Cliente: {l.cliente_nome}</div>}
                  </td>
                  <td>{l.categoria || '—'}</td>
                  <td>
                    <span className={`badge rounded-pill ${l.tipo === 'receita' ? 'text-bg-success' : 'text-bg-danger'}`}>
                      {l.tipo_display}
                    </span>
                  </td>
                  <td className={l.tipo === 'receita' ? 'text-success fw-semibold' : 'text-danger fw-semibold'}>
                    {l.tipo === 'receita' ? '+' : '-'} R$ {parseFloat(l.valor).toFixed(2).replace('.', ',')}
                  </td>
                  <td>
                    <span className={`badge rounded-pill ${l.status === 'pago' ? 'text-bg-success' : 'text-bg-warning'}`}>
                      {l.status_display}
                    </span>
                  </td>
                  <td className="text-end pe-3">
                    <button className="btn btn-sm btn-primary me-1" title="Editar" onClick={() => editar(l)}>
                      <i className="bi bi-pencil"></i>
                    </button>
                    <button className="btn btn-sm btn-danger" title="Excluir" onClick={() => excluir(l.id)}>
                      <i className="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
              {lancamentos.length === 0 && (
                <tr><td colSpan="7" className="text-center text-muted py-4">Nenhum lançamento no período.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {mostrarForm && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setMostrarForm(false)}>
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">{editandoId ? 'Editar Lançamento' : 'Novo Lançamento'}</h5>
                <button className="btn-close" onClick={() => setMostrarForm(false)}></button>
              </div>
              <form onSubmit={salvar}>
                <div className="modal-body">
                  <div className="row g-2 mb-2">
                    <div className="col-6">
                      <label className="form-label small">Tipo</label>
                      <select className="form-select" value={form.tipo}
                        onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                        <option value="receita">Receita</option>
                        <option value="despesa">Despesa</option>
                      </select>
                    </div>
                    <div className="col-6">
                      <label className="form-label small">Data</label>
                      <input type="date" className="form-control" required value={form.data}
                        onChange={(e) => setForm({ ...form, data: e.target.value })} />
                    </div>
                  </div>
                  <div className="mb-2">
                    <label className="form-label small">Descrição</label>
                    <input className="form-control" required value={form.descricao}
                      onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
                  </div>
                  <div className="mb-2">
                    <label className="form-label small">Categoria</label>
                    <input className="form-control" placeholder="Ex: Aluguel, Produtos, Atendimento..." value={form.categoria}
                      onChange={(e) => setForm({ ...form, categoria: e.target.value })} />
                  </div>
                  <div className="row g-2 mb-2">
                    <div className="col-6">
                      <label className="form-label small">Valor (R$)</label>
                      <input type="number" step="0.01" min="0" className="form-control" required value={form.valor}
                        onChange={(e) => setForm({ ...form, valor: e.target.value })} />
                    </div>
                    <div className="col-6">
                      <label className="form-label small">Status</label>
                      <select className="form-select" value={form.status}
                        onChange={(e) => setForm({ ...form, status: e.target.value })}>
                        <option value="pago">Pago</option>
                        <option value="pendente">Pendente</option>
                      </select>
                    </div>
                  </div>
                  <div className="mb-2">
                    <label className="form-label small">Forma de Pagamento</label>
                    <select className="form-select" value={form.forma_pagamento}
                      onChange={(e) => setForm({ ...form, forma_pagamento: e.target.value })}>
                      {FORMAS_PAGAMENTO.map((f) => <option key={f.valor} value={f.valor}>{f.label}</option>)}
                    </select>
                  </div>
                  <div className="mb-2">
                    <label className="form-label small">Observações</label>
                    <textarea className="form-control" rows="2" value={form.observacoes}
                      onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setMostrarForm(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary" disabled={salvando}>
                    {salvando ? 'Salvando...' : editandoId ? 'Atualizar' : 'Cadastrar'}
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
