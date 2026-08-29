import React, { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';

const UNIDADE_VAZIA = {
  nome_empresa: '', cnpj_cpf: '', nome_contato: '', telefone_contato: '',
  email: '', telegram_id: '', endereco: '', numero: '', bairro: '',
  cidade: '', estado: '', cep: '', pais: 'Brasil', ativo: true,
};

export default function DadosNegocioList() {
  const [unidades, setUnidades] = useState([]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState(UNIDADE_VAZIA);
  const [editandoId, setEditandoId] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  async function carregar() {
    const res = await axiosClient.get('/negocio/');
    setUnidades(res.data.results || res.data);
  }

  useEffect(() => { carregar(); }, []);

  function abrirNovo() {
    setForm(UNIDADE_VAZIA);
    setEditandoId(null);
    setErro('');
    setMostrarForm(true);
  }

  function editar(u) {
    setForm({ ...UNIDADE_VAZIA, ...u });
    setEditandoId(u.id);
    setErro('');
    setMostrarForm(true);
  }

  async function salvar(e) {
    e.preventDefault();
    setErro('');
    setSalvando(true);
    try {
      if (editandoId) {
        await axiosClient.put(`/negocio/${editandoId}/`, form);
      } else {
        await axiosClient.post('/negocio/', form);
      }
      setMostrarForm(false);
      carregar();
    } catch (err) {
      const dadosErro = err.response?.data;
      const mensagem = dadosErro
        ? Object.entries(dadosErro).map(([campo, msgs]) => `${campo}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`).join(' | ')
        : 'Não foi possível salvar. Tente novamente.';
      setErro(mensagem);
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(id) {
    if (!window.confirm('Deseja realmente excluir esta unidade?')) return;
    await axiosClient.delete(`/negocio/${id}/`);
    carregar();
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="fw-bold mb-0">Dados do Negócio</h3>
        <button className="btn btn-primary" onClick={abrirNovo}>
          <i className="bi bi-plus-lg me-1"></i> Nova Unidade
        </button>
      </div>

      <div className="bg-dark text-white rounded-3 px-4 py-3 mb-3 d-flex align-items-center gap-2">
        <i className="bi bi-shop fs-5"></i>
        <span className="fw-bold fs-5">{unidades.length}</span>
        <span className="text-white-50">UNIDADE(S) CADASTRADA(S)</span>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead style={{ backgroundColor: '#1e2a5e' }}>
              <tr className="text-white">
                <th className="py-3 ps-3">EMPRESA</th>
                <th className="py-3">CNPJ/CPF</th>
                <th className="py-3">CONTATO</th>
                <th className="py-3">CIDADE/UF</th>
                <th className="py-3">STATUS</th>
                <th className="py-3 text-end pe-3">AÇÕES</th>
              </tr>
            </thead>
            <tbody>
              {unidades.map((u) => (
                <tr key={u.id}>
                  <td className="ps-3 fw-semibold">{u.nome_empresa}</td>
                  <td>{u.cnpj_cpf || '—'}</td>
                  <td>
                    {u.nome_contato || '—'}
                    {u.telefone_contato && <div className="small text-muted">{u.telefone_contato}</div>}
                  </td>
                  <td>{u.cidade ? `${u.cidade}/${u.estado}` : '—'}</td>
                  <td>
                    <span className={`badge rounded-pill ${u.ativo ? 'text-bg-success' : 'text-bg-secondary'}`}>
                      {u.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="text-end pe-3">
                    <button className="btn btn-sm btn-primary me-1" title="Editar" onClick={() => editar(u)}>
                      <i className="bi bi-pencil"></i>
                    </button>
                    <button className="btn btn-sm btn-danger" title="Excluir" onClick={() => excluir(u.id)}>
                      <i className="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
              {unidades.length === 0 && (
                <tr><td colSpan="6" className="text-center text-muted py-4">Nenhuma unidade cadastrada.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {mostrarForm && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setMostrarForm(false)}>
          <div className="modal-dialog modal-dialog-centered modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">{editandoId ? 'Editar Unidade' : 'Nova Unidade'}</h5>
                <button className="btn-close" onClick={() => setMostrarForm(false)}></button>
              </div>
              <form onSubmit={salvar}>
                <div className="modal-body">
                  {erro && <div className="alert alert-danger py-2 small">{erro}</div>}

                  <div className="row g-2 mb-2">
                    <div className="col-md-8">
                      <label className="form-label small">Nome da Empresa</label>
                      <input className="form-control" required value={form.nome_empresa}
                        onChange={(e) => setForm({ ...form, nome_empresa: e.target.value })} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small">CNPJ ou CPF</label>
                      <input className="form-control" value={form.cnpj_cpf}
                        onChange={(e) => setForm({ ...form, cnpj_cpf: e.target.value.replace(/\D/g, '').slice(0, 14) })} />
                    </div>
                  </div>

                  <hr className="my-3" />
                  <div className="small fw-semibold text-muted mb-2">CONTATO</div>
                  <div className="row g-2 mb-2">
                    <div className="col-md-6">
                      <label className="form-label small">Nome do Contato</label>
                      <input className="form-control" value={form.nome_contato}
                        onChange={(e) => setForm({ ...form, nome_contato: e.target.value })} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small">Telefone / WhatsApp</label>
                      <input className="form-control" value={form.telefone_contato}
                        onChange={(e) => setForm({ ...form, telefone_contato: e.target.value })} />
                    </div>
                  </div>
                  <div className="row g-2 mb-2">
                    <div className="col-md-6">
                      <label className="form-label small">E-mail</label>
                      <input type="email" className="form-control" value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small">ID Telegram (Notificações)</label>
                      <input className="form-control" value={form.telegram_id}
                        onChange={(e) => setForm({ ...form, telegram_id: e.target.value })} />
                    </div>
                  </div>

                  <hr className="my-3" />
                  <div className="small fw-semibold text-muted mb-2">ENDEREÇO</div>
                  <div className="row g-2 mb-2">
                    <div className="col-md-9">
                      <label className="form-label small">Endereço</label>
                      <input className="form-control" value={form.endereco}
                        onChange={(e) => setForm({ ...form, endereco: e.target.value })} />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label small">Número</label>
                      <input className="form-control" value={form.numero}
                        onChange={(e) => setForm({ ...form, numero: e.target.value })} />
                    </div>
                  </div>
                  <div className="row g-2 mb-2">
                    <div className="col-md-6">
                      <label className="form-label small">Bairro</label>
                      <input className="form-control" value={form.bairro}
                        onChange={(e) => setForm({ ...form, bairro: e.target.value })} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small">Cidade</label>
                      <input className="form-control" value={form.cidade}
                        onChange={(e) => setForm({ ...form, cidade: e.target.value })} />
                    </div>
                    <div className="col-md-2">
                      <label className="form-label small">UF</label>
                      <input className="form-control" maxLength={2} value={form.estado}
                        onChange={(e) => setForm({ ...form, estado: e.target.value.toUpperCase() })} />
                    </div>
                  </div>
                  <div className="row g-2 mb-2">
                    <div className="col-md-4">
                      <label className="form-label small">CEP</label>
                      <input className="form-control" value={form.cep}
                        onChange={(e) => setForm({ ...form, cep: e.target.value })} />
                    </div>
                    <div className="col-md-8">
                      <label className="form-label small">País</label>
                      <input className="form-control" value={form.pais}
                        onChange={(e) => setForm({ ...form, pais: e.target.value })} />
                    </div>
                  </div>

                  <div className="form-check mt-2">
                    <input className="form-check-input" type="checkbox" id="ativoUnidade"
                      checked={form.ativo}
                      onChange={(e) => setForm({ ...form, ativo: e.target.checked })} />
                    <label className="form-check-label small" htmlFor="ativoUnidade">Ativo</label>
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
