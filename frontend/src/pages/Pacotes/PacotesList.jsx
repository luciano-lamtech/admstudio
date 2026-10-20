import React, { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';

const VAZIO = { nome: '', servico: '', sessoes: 1, preco: '', validade_dias: 180, ativo: true };

function extrairErro(err) {
  const d = err.response?.data;
  if (d && typeof d === 'object' && !Array.isArray(d)) {
    return Object.values(d).flat().join(' ');
  }
  if (typeof d?.detail === 'string') return d.detail;
  return 'Não foi possível salvar. Tente novamente.';
}

export default function PacotesList() {
  const [pacotes, setPacotes] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState(VAZIO);
  const [editandoId, setEditandoId] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  async function carregar() {
    const r = await axiosClient.get('/pacotes/');
    setPacotes(r.data.results || r.data);
  }

  useEffect(() => {
    carregar();
    axiosClient.get('/catalogo/', { params: { tipo: 'servico' } })
      .then((r) => setServicos(r.data.results || r.data));
  }, []); // eslint-disable-line

  function abrirNovo() {
    setForm(VAZIO);
    setEditandoId(null);
    setErro('');
    setMostrarForm(true);
  }

  function editar(p) {
    setForm({
      nome: p.nome, servico: p.servico || '', sessoes: p.sessoes,
      preco: p.preco, validade_dias: p.validade_dias, ativo: p.ativo,
    });
    setEditandoId(p.id);
    setErro('');
    setMostrarForm(true);
  }

  async function salvar(e) {
    e.preventDefault();
    setSalvando(true);
    setErro('');
    const payload = {
      ...form,
      servico: form.servico || null,
      sessoes: parseInt(form.sessoes, 10) || 1,
      preco: parseFloat(form.preco) || 0,
      validade_dias: parseInt(form.validade_dias, 10) || 180,
    };
    try {
      if (editandoId) {
        await axiosClient.put(`/pacotes/${editandoId}/`, payload);
      } else {
        await axiosClient.post('/pacotes/', payload);
      }
      setMostrarForm(false);
      carregar();
    } catch (err) {
      setErro(extrairErro(err));
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(id) {
    if (!window.confirm('Excluir este pacote?')) return;
    try {
      await axiosClient.delete(`/pacotes/${id}/`);
      carregar();
    } catch (err) {
      window.alert(extrairErro(err));
    }
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="fw-bold mb-0">Pacotes e Planos</h3>
        <button className="btn btn-primary" onClick={abrirNovo}>
          <i className="bi bi-plus-lg me-1"></i> Novo Pacote
        </button>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead style={{ backgroundColor: '#1e2a5e' }}>
              <tr className="text-white">
                <th className="py-3 ps-3">NOME</th>
                <th className="py-3">SERVIÇO</th>
                <th className="py-3">SESSÕES</th>
                <th className="py-3">PREÇO</th>
                <th className="py-3">VALIDADE</th>
                <th className="py-3">STATUS</th>
                <th className="py-3 text-end pe-3">AÇÕES</th>
              </tr>
            </thead>
            <tbody>
              {pacotes.map((p) => (
                <tr key={p.id}>
                  <td className="ps-3 fw-semibold">{p.nome}</td>
                  <td>{p.servico_nome || '—'}</td>
                  <td>{p.sessoes}</td>
                  <td>R$ {parseFloat(p.preco).toFixed(2).replace('.', ',')}</td>
                  <td>{p.validade_dias} dias</td>
                  <td>
                    <span className={`badge rounded-pill ${p.ativo ? 'text-bg-success' : 'text-bg-secondary'}`}>
                      {p.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="text-end pe-3">
                    <button className="btn btn-sm btn-primary me-1" title="Editar" onClick={() => editar(p)}>
                      <i className="bi bi-pencil"></i>
                    </button>
                    <button className="btn btn-sm btn-danger" title="Excluir" onClick={() => excluir(p.id)}>
                      <i className="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
              {pacotes.length === 0 && (
                <tr><td colSpan="7" className="text-center text-muted py-4">Nenhum pacote cadastrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {mostrarForm && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setMostrarForm(false)}>
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">{editandoId ? 'Editar Pacote' : 'Novo Pacote'}</h5>
                <button className="btn-close" onClick={() => setMostrarForm(false)}></button>
              </div>
              <form onSubmit={salvar}>
                <div className="modal-body">
                  {erro && <div className="alert alert-danger py-2 small">{erro}</div>}
                  <div className="mb-2">
                    <label className="form-label small">Nome do pacote</label>
                    <input className="form-control" required placeholder="Ex: 10 sessões de depilação"
                      value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
                  </div>
                  <div className="mb-2">
                    <label className="form-label small">Serviço incluído (opcional)</label>
                    <select className="form-select" value={form.servico}
                      onChange={(e) => setForm({ ...form, servico: e.target.value })}>
                      <option value="">Nenhum</option>
                      {servicos.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
                    </select>
                  </div>
                  <div className="row g-2 mb-2">
                    <div className="col-4">
                      <label className="form-label small">Sessões</label>
                      <input type="number" min="1" className="form-control" required value={form.sessoes}
                        onChange={(e) => setForm({ ...form, sessoes: e.target.value })} />
                    </div>
                    <div className="col-4">
                      <label className="form-label small">Preço (R$)</label>
                      <input type="number" step="0.01" min="0" className="form-control" required value={form.preco}
                        onChange={(e) => setForm({ ...form, preco: e.target.value })} />
                    </div>
                    <div className="col-4">
                      <label className="form-label small">Validade (dias)</label>
                      <input type="number" min="1" className="form-control" value={form.validade_dias}
                        onChange={(e) => setForm({ ...form, validade_dias: e.target.value })} />
                    </div>
                  </div>
                  <div className="form-check">
                    <input className="form-check-input" type="checkbox" id="pacoteAtivo" checked={!!form.ativo}
                      onChange={(e) => setForm({ ...form, ativo: e.target.checked })} />
                    <label className="form-check-label small" htmlFor="pacoteAtivo">Ativo (disponível para venda)</label>
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
