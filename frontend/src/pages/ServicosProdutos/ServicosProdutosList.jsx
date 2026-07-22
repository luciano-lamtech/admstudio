import React, { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';

const ITEM_VAZIO = {
  tipo: 'servico', nome: '', descricao: '', categoria: '', preco: '',
  duracao_minutos: '', controla_estoque: false, estoque_atual: 0,
};

export default function ServicosProdutosList() {
  const [itens, setItens] = useState([]);
  const [busca, setBusca] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState('todos');
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState(ITEM_VAZIO);
  const [editandoId, setEditandoId] = useState(null);
  const [salvando, setSalvando] = useState(false);

  async function carregar() {
    const params = { search: busca || undefined };
    if (tipoFiltro !== 'todos') params.tipo = tipoFiltro;
    const res = await axiosClient.get('/catalogo/', { params });
    setItens(res.data.results || res.data);
  }

  useEffect(() => { carregar(); }, [busca, tipoFiltro]); // eslint-disable-line

  function abrirNovo() {
    setForm(ITEM_VAZIO);
    setEditandoId(null);
    setMostrarForm(true);
  }

  function editar(item) {
    setForm(item);
    setEditandoId(item.id);
    setMostrarForm(true);
  }

  async function salvar(e) {
    e.preventDefault();
    setSalvando(true);
    try {
      const payload = { ...form, preco: parseFloat(form.preco) || 0 };
      if (form.tipo === 'servico') {
        payload.duracao_minutos = form.duracao_minutos ? parseInt(form.duracao_minutos, 10) : null;
        payload.controla_estoque = false;
        payload.estoque_atual = 0;
      } else {
        payload.duracao_minutos = null;
      }

      if (editandoId) {
        await axiosClient.put(`/catalogo/${editandoId}/`, payload);
      } else {
        await axiosClient.post('/catalogo/', payload);
      }
      setMostrarForm(false);
      carregar();
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(id) {
    if (!window.confirm('Deseja realmente excluir este item?')) return;
    await axiosClient.delete(`/catalogo/${id}/`);
    carregar();
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="fw-bold mb-0">Serviços e Produtos</h3>
        <button className="btn btn-primary" onClick={abrirNovo}>
          <i className="bi bi-plus-lg me-1"></i> Novo Item
        </button>
      </div>

      {/* Contador */}
      <div className="bg-dark text-white rounded-3 px-4 py-3 mb-3 d-flex align-items-center gap-2">
        <i className="bi bi-bag-check-fill fs-5"></i>
        <span className="fw-bold fs-5">{itens.length}</span>
        <span className="text-white-50">ITENS</span>
      </div>

      {/* Busca + filtro */}
      <div className="d-flex gap-2 mb-3">
        <input
          className="form-control"
          placeholder="Buscar por nome..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        <select
          className="form-select w-auto"
          value={tipoFiltro}
          onChange={(e) => setTipoFiltro(e.target.value)}
        >
          <option value="todos">Todos os tipos</option>
          <option value="servico">Serviços</option>
          <option value="produto">Produtos</option>
        </select>
      </div>

      {/* Tabela */}
      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead style={{ backgroundColor: '#1e2a5e' }}>
              <tr className="text-white">
                <th className="py-3 ps-3">NOME</th>
                <th className="py-3">TIPO</th>
                <th className="py-3">CATEGORIA</th>
                <th className="py-3">PREÇO</th>
                <th className="py-3">DETALHE</th>
                <th className="py-3">STATUS</th>
                <th className="py-3 text-end pe-3">AÇÕES</th>
              </tr>
            </thead>
            <tbody>
              {itens.map((item) => (
                <tr key={item.id}>
                  <td className="ps-3 fw-semibold">{item.nome}</td>
                  <td>
                    <span className={`badge rounded-pill ${item.tipo === 'servico' ? 'text-bg-info' : 'text-bg-warning'}`}>
                      {item.tipo_display}
                    </span>
                  </td>
                  <td>{item.categoria || '—'}</td>
                  <td>R$ {parseFloat(item.preco).toFixed(2).replace('.', ',')}</td>
                  <td>
                    {item.tipo === 'servico'
                      ? (item.duracao_minutos ? `${item.duracao_minutos} min` : '—')
                      : (item.controla_estoque ? `Estoque: ${item.estoque_atual}` : 'Sem controle de estoque')}
                  </td>
                  <td>
                    <span className={`badge rounded-pill ${item.ativo ? 'text-bg-success' : 'text-bg-secondary'}`}>
                      {item.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="text-end pe-3">
                    <button className="btn btn-sm btn-primary me-1" title="Editar" onClick={() => editar(item)}>
                      <i className="bi bi-pencil"></i>
                    </button>
                    <button className="btn btn-sm btn-danger" title="Excluir" onClick={() => excluir(item.id)}>
                      <i className="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
              {itens.length === 0 && (
                <tr><td colSpan="7" className="text-center text-muted py-4">Nenhum item encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de criação/edição */}
      {mostrarForm && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setMostrarForm(false)}>
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">{editandoId ? 'Editar Item' : 'Novo Item'}</h5>
                <button className="btn-close" onClick={() => setMostrarForm(false)}></button>
              </div>
              <form onSubmit={salvar}>
                <div className="modal-body">
                  <div className="mb-2">
                    <label className="form-label small">Tipo</label>
                    <select className="form-select" value={form.tipo}
                      onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                      <option value="servico">Serviço</option>
                      <option value="produto">Produto</option>
                    </select>
                  </div>
                  <div className="mb-2">
                    <label className="form-label small">Nome</label>
                    <input className="form-control" required value={form.nome}
                      onChange={(e) => setForm({ ...form, nome: e.target.value })} />
                  </div>
                  <div className="mb-2">
                    <label className="form-label small">Categoria</label>
                    <input className="form-control" placeholder="Ex: Cabelo, Unha, Skincare..." value={form.categoria || ''}
                      onChange={(e) => setForm({ ...form, categoria: e.target.value })} />
                  </div>
                  <div className="mb-2">
                    <label className="form-label small">Preço (R$)</label>
                    <input type="number" step="0.01" min="0" className="form-control" required value={form.preco}
                      onChange={(e) => setForm({ ...form, preco: e.target.value })} />
                  </div>

                  {form.tipo === 'servico' ? (
                    <div className="mb-2">
                      <label className="form-label small">Duração estimada (minutos)</label>
                      <input type="number" min="0" className="form-control" placeholder="Ex: 60" value={form.duracao_minutos || ''}
                        onChange={(e) => setForm({ ...form, duracao_minutos: e.target.value })} />
                    </div>
                  ) : (
                    <>
                      <div className="form-check mb-2">
                        <input className="form-check-input" type="checkbox" id="controlaEstoque"
                          checked={!!form.controla_estoque}
                          onChange={(e) => setForm({ ...form, controla_estoque: e.target.checked })} />
                        <label className="form-check-label small" htmlFor="controlaEstoque">
                          Controlar estoque deste produto
                        </label>
                      </div>
                      {form.controla_estoque && (
                        <div className="mb-2">
                          <label className="form-label small">Estoque atual</label>
                          <input type="number" min="0" className="form-control" value={form.estoque_atual}
                            onChange={(e) => setForm({ ...form, estoque_atual: e.target.value })} />
                        </div>
                      )}
                    </>
                  )}

                  <div className="mb-2">
                    <label className="form-label small">Descrição</label>
                    <textarea className="form-control" rows="2" value={form.descricao || ''}
                      onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
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
