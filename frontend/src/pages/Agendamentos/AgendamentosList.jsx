import React, { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';
import { hojeISO } from '../../utils/datas';

const STATUS_LABELS = {
  agendado: { label: 'Agendado', cor: 'text-bg-secondary' },
  confirmado: { label: 'Confirmado', cor: 'text-bg-info' },
  em_atendimento: { label: 'Em Atendimento', cor: 'text-bg-warning' },
  concluido: { label: 'Concluído', cor: 'text-bg-success' },
  cancelado: { label: 'Cancelado', cor: 'text-bg-danger' },
};

const AGENDAMENTO_VAZIO = {
  cliente: '', profissional: '', data_hora: '', status: 'agendado', observacoes: '', itens: [],
};

// Agenda visual: horário das 08:00 às 19:30, em blocos de 30 minutos
const HORA_INICIO = 8;
const HORA_FIM = 20;
const ALTURA_SLOT = 48; // px por bloco de 30 minutos
const SLOTS = [];
for (let h = HORA_INICIO; h < HORA_FIM; h++) {
  SLOTS.push(`${String(h).padStart(2, '0')}:00`);
  SLOTS.push(`${String(h).padStart(2, '0')}:30`);
}

function duracaoAgendamento(ag) {
  const total = (ag.itens || []).reduce((soma, i) => {
    const duracao = i.item_catalogo_tipo === 'servico' ? (i.item_catalogo_duracao || 0) : 0;
    return soma + duracao * (i.quantidade || 1);
  }, 0);
  return total > 0 ? total : 30; // mínimo de 30 min pro bloco não ficar invisível
}

export default function AgendamentosList() {
  const [agendamentos, setAgendamentos] = useState([]);
  const [dataFiltro, setDataFiltro] = useState(hojeISO());
  const [statusFiltro, setStatusFiltro] = useState('todos');

  const [clientes, setClientes] = useState([]);
  const [profissionais, setProfissionais] = useState([]);
  const [catalogo, setCatalogo] = useState([]);

  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState(AGENDAMENTO_VAZIO);
  const [editandoId, setEditandoId] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [visualizacao, setVisualizacao] = useState('agenda'); // 'agenda' | 'lista'

  async function carregarAgendamentos() {
    const params = { data: dataFiltro || undefined };
    if (statusFiltro !== 'todos') params.status = statusFiltro;
    const res = await axiosClient.get('/agendamentos/', { params });
    setAgendamentos(res.data.results || res.data);
  }

  async function carregarListasApoio() {
    const [resClientes, resProfissionais, resCatalogo] = await Promise.all([
      axiosClient.get('/clientes/'),
      axiosClient.get('/profissionais/', { params: { ativo: 'true' } }),
      axiosClient.get('/catalogo/'),
    ]);
    setClientes(resClientes.data.results || resClientes.data);
    setProfissionais(resProfissionais.data.results || resProfissionais.data);
    setCatalogo(resCatalogo.data.results || resCatalogo.data);
  }

  useEffect(() => { carregarAgendamentos(); }, [dataFiltro, statusFiltro]); // eslint-disable-line
  useEffect(() => { carregarListasApoio(); }, []);

  function abrirNovo(profissionalId, horario) {
    setForm({
      ...AGENDAMENTO_VAZIO,
      profissional: profissionalId || '',
      data_hora: `${dataFiltro}T${horario || '09:00'}`,
    });
    setEditandoId(null);
    setMostrarForm(true);
  }

  function editar(ag) {
    setForm({
      cliente: ag.cliente,
      profissional: ag.profissional || '',
      data_hora: ag.data_hora ? ag.data_hora.slice(0, 16) : '',
      status: ag.status,
      observacoes: ag.observacoes || '',
      itens: ag.itens.map((i) => ({
        item_catalogo: i.item_catalogo,
        quantidade: i.quantidade,
        preco_unitario: i.preco_unitario,
      })),
    });
    setEditandoId(ag.id);
    setMostrarForm(true);
  }

  function adicionarItem() {
    setForm({ ...form, itens: [...form.itens, { item_catalogo: '', quantidade: 1, preco_unitario: '' }] });
  }

  function atualizarItem(index, campo, valor) {
    const novosItens = [...form.itens];
    novosItens[index] = { ...novosItens[index], [campo]: valor };
    if (campo === 'item_catalogo') {
      const itemCat = catalogo.find((c) => String(c.id) === String(valor));
      if (itemCat) novosItens[index].preco_unitario = itemCat.preco;
    }
    setForm({ ...form, itens: novosItens });
  }

  function removerItem(index) {
    setForm({ ...form, itens: form.itens.filter((_, i) => i !== index) });
  }

  const totalForm = form.itens.reduce(
    (soma, i) => soma + (parseFloat(i.preco_unitario) || 0) * (parseInt(i.quantidade, 10) || 0), 0,
  );

  async function salvar(e) {
    e.preventDefault();
    setSalvando(true);
    try {
      const payload = {
        ...form,
        profissional: form.profissional || null,
        itens: form.itens
          .filter((i) => i.item_catalogo)
          .map((i) => ({
            item_catalogo: i.item_catalogo,
            quantidade: parseInt(i.quantidade, 10) || 1,
            preco_unitario: parseFloat(i.preco_unitario) || 0,
          })),
      };
      if (editandoId) {
        await axiosClient.put(`/agendamentos/${editandoId}/`, payload);
      } else {
        await axiosClient.post('/agendamentos/', payload);
      }
      setMostrarForm(false);
      carregarAgendamentos();
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(id) {
    if (!window.confirm('Deseja realmente excluir este agendamento?')) return;
    await axiosClient.delete(`/agendamentos/${id}/`);
    carregarAgendamentos();
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="fw-bold mb-0">Agendamentos</h3>
        <button className="btn btn-primary" onClick={abrirNovo}>
          <i className="bi bi-plus-lg me-1"></i> Novo Agendamento
        </button>
      </div>

      <div className="bg-dark text-white rounded-3 px-4 py-3 mb-3 d-flex align-items-center gap-2">
        <i className="bi bi-calendar-check-fill fs-5"></i>
        <span className="fw-bold fs-5">{agendamentos.length}</span>
        <span className="text-white-50">AGENDAMENTOS NO DIA</span>
      </div>

      <div className="d-flex gap-2 mb-3 flex-wrap align-items-center justify-content-between">
        <div className="d-flex gap-2">
          <input type="date" className="form-control w-auto" value={dataFiltro}
            onChange={(e) => setDataFiltro(e.target.value)} />
          <select className="form-select w-auto" value={statusFiltro}
            onChange={(e) => setStatusFiltro(e.target.value)}>
            <option value="todos">Todos os status</option>
            {Object.entries(STATUS_LABELS).map(([valor, { label }]) => (
              <option key={valor} value={valor}>{label}</option>
            ))}
          </select>
        </div>
        <div className="btn-group">
          <button
            className={`btn btn-sm ${visualizacao === 'agenda' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setVisualizacao('agenda')}
          >
            <i className="bi bi-calendar3 me-1"></i> Agenda
          </button>
          <button
            className={`btn btn-sm ${visualizacao === 'lista' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setVisualizacao('lista')}
          >
            <i className="bi bi-list-ul me-1"></i> Lista
          </button>
        </div>
      </div>

      {visualizacao === 'agenda' && (
        <div className="card border-0 shadow-sm mb-3">
          <div className="card-body p-0" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `70px repeat(${profissionais.length || 1}, minmax(160px, 1fr))`,
              }}
            >
              {/* Cabeçalho fixo */}
              <div style={{ position: 'sticky', top: 0, zIndex: 3, backgroundColor: '#fff' }} className="border-bottom border-end"></div>
              {profissionais.length === 0 && (
                <div
                  style={{ position: 'sticky', top: 0, zIndex: 3 }}
                  className="border-bottom p-2 text-center text-muted small bg-white"
                >
                  Nenhum profissional ativo cadastrado
                </div>
              )}
              {profissionais.map((p) => (
                <div
                  key={p.id}
                  style={{ position: 'sticky', top: 0, zIndex: 3, backgroundColor: p.cor || '#3b82f6' }}
                  className="border-bottom p-2 text-center text-white fw-semibold small"
                >
                  {p.nome}
                </div>
              ))}

              {/* Coluna de horários */}
              <div style={{ gridColumn: 1 }}>
                {SLOTS.map((hora) => (
                  <div
                    key={hora}
                    style={{ height: ALTURA_SLOT }}
                    className="border-end border-bottom text-muted small text-center pt-1"
                  >
                    {hora.endsWith(':00') ? hora : ''}
                  </div>
                ))}
              </div>

              {/* Colunas dos profissionais */}
              {profissionais.map((prof) => (
                <div key={prof.id} style={{ position: 'relative', gridColumn: 'auto' }}>
                  {/* Linhas clicáveis de fundo */}
                  {SLOTS.map((hora) => (
                    <div
                      key={hora}
                      style={{ height: ALTURA_SLOT, cursor: 'pointer' }}
                      className="border-end border-bottom"
                      onClick={() => abrirNovo(prof.id, hora)}
                    ></div>
                  ))}

                  {/* Blocos de agendamento, posicionados por cima */}
                  {agendamentos
                    .filter((ag) => ag.profissional === prof.id)
                    .map((ag) => {
                      const dataHora = new Date(ag.data_hora);
                      const minutosDoInicio = (dataHora.getHours() - HORA_INICIO) * 60 + dataHora.getMinutes();
                      const top = (minutosDoInicio / 30) * ALTURA_SLOT;
                      const duracao = duracaoAgendamento(ag);
                      const altura = Math.max((duracao / 30) * ALTURA_SLOT - 2, 20);
                      if (minutosDoInicio < 0 || minutosDoInicio > (HORA_FIM - HORA_INICIO) * 60) return null;
                      return (
                        <div
                          key={ag.id}
                          onClick={(e) => { e.stopPropagation(); editar(ag); }}
                          style={{
                            position: 'absolute',
                            top,
                            left: 2,
                            right: 2,
                            height: altura,
                            backgroundColor: `${prof.cor}22`,
                            borderLeft: `4px solid ${prof.cor}`,
                            borderRadius: 4,
                            padding: '2px 6px',
                            overflow: 'hidden',
                            cursor: 'pointer',
                            zIndex: 2,
                          }}
                          title={`${ag.cliente_nome} - ${STATUS_LABELS[ag.status]?.label}`}
                        >
                          <div className="small fw-bold text-truncate">{ag.cliente_nome}</div>
                          <div className="small text-truncate">
                            {dataHora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            {' · '}
                            <span className={`badge rounded-pill ${STATUS_LABELS[ag.status]?.cor}`} style={{ fontSize: '0.65rem' }}>
                              {STATUS_LABELS[ag.status]?.label}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {visualizacao === 'lista' && (
      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead style={{ backgroundColor: '#1e2a5e' }}>
              <tr className="text-white">
                <th className="py-3 ps-3">HORÁRIO</th>
                <th className="py-3">CLIENTE</th>
                <th className="py-3">PROFISSIONAL</th>
                <th className="py-3">ITENS</th>
                <th className="py-3">TOTAL</th>
                <th className="py-3">STATUS</th>
                <th className="py-3 text-end pe-3">AÇÕES</th>
              </tr>
            </thead>
            <tbody>
              {agendamentos.map((ag) => (
                <tr key={ag.id}>
                  <td className="ps-3 fw-semibold">
                    {new Date(ag.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td>{ag.cliente_nome}</td>
                  <td>{ag.profissional_nome || '—'}</td>
                  <td className="small text-muted">
                    {ag.itens.map((i) => i.item_catalogo_nome).join(', ') || '—'}
                  </td>
                  <td>R$ {parseFloat(ag.valor_total).toFixed(2).replace('.', ',')}</td>
                  <td>
                    <span className={`badge rounded-pill ${STATUS_LABELS[ag.status]?.cor || 'text-bg-secondary'}`}>
                      {STATUS_LABELS[ag.status]?.label || ag.status}
                    </span>
                  </td>
                  <td className="text-end pe-3">
                    <button className="btn btn-sm btn-primary me-1" title="Editar" onClick={() => editar(ag)}>
                      <i className="bi bi-pencil"></i>
                    </button>
                    <button className="btn btn-sm btn-danger" title="Excluir" onClick={() => excluir(ag.id)}>
                      <i className="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
              {agendamentos.length === 0 && (
                <tr><td colSpan="7" className="text-center text-muted py-4">Nenhum agendamento para essa data.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {mostrarForm && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setMostrarForm(false)}>
          <div className="modal-dialog modal-dialog-centered modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">{editandoId ? 'Editar Agendamento' : 'Novo Agendamento'}</h5>
                <button className="btn-close" onClick={() => setMostrarForm(false)}></button>
              </div>
              <form onSubmit={salvar}>
                <div className="modal-body">
                  <div className="row g-2 mb-2">
                    <div className="col-md-6">
                      <label className="form-label small">Cliente</label>
                      <select className="form-select" required value={form.cliente}
                        onChange={(e) => setForm({ ...form, cliente: e.target.value })}>
                        <option value="">Selecione...</option>
                        {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small">Profissional</label>
                      <select className="form-select" value={form.profissional}
                        onChange={(e) => setForm({ ...form, profissional: e.target.value })}>
                        <option value="">Não definido</option>
                        {profissionais.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-md-6">
                      <label className="form-label small">Data e Hora</label>
                      <input type="datetime-local" className="form-control" required value={form.data_hora}
                        onChange={(e) => setForm({ ...form, data_hora: e.target.value })} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small">Status</label>
                      <select className="form-select" value={form.status}
                        onChange={(e) => setForm({ ...form, status: e.target.value })}>
                        {Object.entries(STATUS_LABELS).map(([valor, { label }]) => (
                          <option key={valor} value={valor}>{label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <label className="form-label small fw-semibold d-block">Serviços / Produtos</label>
                  {form.itens.map((item, index) => (
                    <div className="row g-2 mb-2 align-items-center" key={index}>
                      <div className="col-5">
                        <select className="form-select form-select-sm" value={item.item_catalogo}
                          onChange={(e) => atualizarItem(index, 'item_catalogo', e.target.value)}>
                          <option value="">Selecione...</option>
                          {catalogo.map((c) => (
                            <option key={c.id} value={c.id}>{c.nome} (R$ {parseFloat(c.preco).toFixed(2)})</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-2">
                        <input type="number" min="1" className="form-control form-control-sm" placeholder="Qtd"
                          value={item.quantidade}
                          onChange={(e) => atualizarItem(index, 'quantidade', e.target.value)} />
                      </div>
                      <div className="col-3">
                        <input type="number" step="0.01" min="0" className="form-control form-control-sm" placeholder="Preço"
                          value={item.preco_unitario}
                          onChange={(e) => atualizarItem(index, 'preco_unitario', e.target.value)} />
                      </div>
                      <div className="col-2">
                        <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removerItem(index)}>
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                  <button type="button" className="btn btn-sm btn-outline-primary mb-3" onClick={adicionarItem}>
                    <i className="bi bi-plus-lg me-1"></i> Adicionar item
                  </button>

                  <div className="mb-2">
                    <label className="form-label small">Observações</label>
                    <textarea className="form-control" rows="2" value={form.observacoes}
                      onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
                  </div>

                  <div className="text-end fw-bold fs-5">
                    Total: R$ {totalForm.toFixed(2).replace('.', ',')}
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setMostrarForm(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary" disabled={salvando}>
                    {salvando ? 'Salvando...' : editandoId ? 'Atualizar' : 'Agendar'}
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
