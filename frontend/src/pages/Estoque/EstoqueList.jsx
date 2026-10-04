import React, { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';

const TIPO_INFO = {
  entrada: { label: 'Entrada', cor: 'text-bg-success', sinal: '+' },
  saida: { label: 'Saída', cor: 'text-bg-danger', sinal: '-' },
  ajuste: { label: 'Ajuste', cor: 'text-bg-info', sinal: '=' },
};

const MOVIMENTACAO_VAZIA = { item_catalogo: '', tipo: 'entrada', quantidade: '', motivo: '' };

export default function EstoqueList() {
  const [produtos, setProdutos] = useState([]);
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [filtroItem, setFiltroItem] = useState('');

  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState(MOVIMENTACAO_VAZIA);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  async function carregarProdutos() {
    const res = await axiosClient.get('/catalogo/', { params: { tipo: 'produto' } });
    const lista = res.data.results || res.data;
    setProdutos(lista.filter((p) => p.controla_estoque));
  }

  async function carregarMovimentacoes() {
    const res = await axiosClient.get('/estoque/', { params: { item: filtroItem || undefined } });
    setMovimentacoes(res.data.results || res.data);
  }

  useEffect(() => { carregarProdutos(); }, []);
  useEffect(() => { carregarMovimentacoes(); }, [filtroItem]); // eslint-disable-line

  const produtosEstoqueBaixo = produtos.filter((p) => p.estoque_atual <= p.estoque_minimo);

  function abrirNovaMovimentacao(itemId) {
    setForm({ ...MOVIMENTACAO_VAZIA, item_catalogo: itemId || '' });
    setErro('');
    setMostrarForm(true);
  }

  async function salvarMovimentacao(e) {
    e.preventDefault();
    setErro('');
    setSalvando(true);
    try {
      await axiosClient.post('/estoque/', {
        item_catalogo: form.item_catalogo,
        tipo: form.tipo,
        quantidade: parseInt(form.quantidade, 10) || 0,
        motivo: form.motivo,
      });
      setMostrarForm(false);
      carregarProdutos();
      carregarMovimentacoes();
    } catch (err) {
      const dadosErro = err.response?.data;
      let mensagem = 'Não foi possível salvar. Tente novamente.';
      if (dadosErro && typeof dadosErro === 'object' && !Array.isArray(dadosErro)) {
        mensagem = Object.entries(dadosErro)
          .map(([campo, msgs]) => `${campo}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
          .join(' | ');
      } else if (typeof dadosErro === 'string') {
        mensagem = dadosErro;
      }
      setErro(mensagem);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="fw-bold mb-0">Controle de Estoque</h3>
        <button className="btn btn-primary" onClick={() => abrirNovaMovimentacao()}>
          <i className="bi bi-plus-lg me-1"></i> Nova Movimentação
        </button>
      </div>

      {/* Cards de resumo */}
      <div className="row row-cols-1 row-cols-md-2 g-3 mb-4">
        <div className="col">
          <div className="card border-0 shadow-sm h-100" style={{ backgroundColor: '#d6eaf8', borderRadius: '10px' }}>
            <div className="card-body text-center">
              <div className="text-uppercase small fw-semibold mb-1 opacity-75">Produtos com Controle de Estoque</div>
              <div className="fs-3 fw-bold">{produtos.length}</div>
            </div>
          </div>
        </div>
        <div className="col">
          <div className="card border-0 shadow-sm h-100" style={{ backgroundColor: produtosEstoqueBaixo.length > 0 ? '#fbdada' : '#d5f2df', borderRadius: '10px' }}>
            <div className="card-body text-center">
              <div className="text-uppercase small fw-semibold mb-1 opacity-75">Produtos com Estoque Baixo</div>
              <div className="fs-3 fw-bold">{produtosEstoqueBaixo.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Alerta de estoque baixo */}
      {produtosEstoqueBaixo.length > 0 && (
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <div className="fw-bold text-danger mb-2">
              <i className="bi bi-exclamation-triangle-fill me-1"></i> Produtos abaixo do estoque mínimo
            </div>
            <div className="table-responsive">
              <table className="table table-sm align-middle mb-0">
                <tbody>
                  {produtosEstoqueBaixo.map((p) => (
                    <tr key={p.id}>
                      <td className="fw-semibold">{p.nome}</td>
                      <td>Atual: <strong className="text-danger">{p.estoque_atual}</strong> / Mínimo: {p.estoque_minimo}</td>
                      <td className="text-end">
                        <button className="btn btn-sm btn-outline-success" onClick={() => abrirNovaMovimentacao(p.id)}>
                          <i className="bi bi-plus-lg me-1"></i> Repor
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Filtro por produto */}
      <div className="d-flex gap-2 mb-3">
        <select className="form-select w-auto" value={filtroItem} onChange={(e) => setFiltroItem(e.target.value)}>
          <option value="">Todos os produtos</option>
          {produtos.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
        </select>
      </div>

      {/* Histórico de movimentações */}
      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead style={{ backgroundColor: '#1e2a5e' }}>
              <tr className="text-white">
                <th className="py-3 ps-3">DATA</th>
                <th className="py-3">PRODUTO</th>
                <th className="py-3">TIPO</th>
                <th className="py-3">QUANTIDADE</th>
                <th className="py-3">ESTOQUE RESULTANTE</th>
                <th className="py-3">MOTIVO</th>
                <th className="py-3 pe-3">USUÁRIO</th>
              </tr>
            </thead>
            <tbody>
              {movimentacoes.map((m) => (
                <tr key={m.id}>
                  <td className="ps-3">{new Date(m.created_at).toLocaleString('pt-BR')}</td>
                  <td className="fw-semibold">{m.item_nome}</td>
                  <td>
                    <span className={`badge rounded-pill ${TIPO_INFO[m.tipo]?.cor || 'text-bg-secondary'}`}>
                      {m.tipo_display}
                    </span>
                  </td>
                  <td>{TIPO_INFO[m.tipo]?.sinal} {m.quantidade}</td>
                  <td>{m.estoque_resultante}</td>
                  <td className="small text-muted">{m.motivo || '—'}</td>
                  <td className="pe-3 small">{m.usuario_nome || '—'}</td>
                </tr>
              ))}
              {movimentacoes.length === 0 && (
                <tr><td colSpan="7" className="text-center text-muted py-4">Nenhuma movimentação registrada.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de nova movimentação */}
      {mostrarForm && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setMostrarForm(false)}>
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Nova Movimentação de Estoque</h5>
                <button className="btn-close" onClick={() => setMostrarForm(false)}></button>
              </div>
              <form onSubmit={salvarMovimentacao}>
                <div className="modal-body">
                  {erro && <div className="alert alert-danger py-2 small">{erro}</div>}
                  <div className="mb-2">
                    <label className="form-label small">Produto</label>
                    <select className="form-select" required value={form.item_catalogo}
                      onChange={(e) => setForm({ ...form, item_catalogo: e.target.value })}>
                      <option value="">Selecione...</option>
                      {produtos.map((p) => (
                        <option key={p.id} value={p.id}>{p.nome} (estoque atual: {p.estoque_atual})</option>
                      ))}
                    </select>
                  </div>
                  <div className="row g-2 mb-2">
                    <div className="col-6">
                      <label className="form-label small">Tipo</label>
                      <select className="form-select" value={form.tipo}
                        onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                        <option value="entrada">Entrada</option>
                        <option value="saida">Saída</option>
                        <option value="ajuste">Ajuste (define o novo total)</option>
                      </select>
                    </div>
                    <div className="col-6">
                      <label className="form-label small">
                        {form.tipo === 'ajuste' ? 'Novo total' : 'Quantidade'}
                      </label>
                      <input type="number" min="0" className="form-control" required value={form.quantidade}
                        onChange={(e) => setForm({ ...form, quantidade: e.target.value })} />
                    </div>
                  </div>
                  <div className="mb-2">
                    <label className="form-label small">Motivo</label>
                    <input className="form-control" placeholder="Ex: Compra fornecedor, Venda avulsa, Perda..."
                      value={form.motivo}
                      onChange={(e) => setForm({ ...form, motivo: e.target.value })} />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setMostrarForm(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary" disabled={salvando}>
                    {salvando ? 'Salvando...' : 'Registrar'}
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
