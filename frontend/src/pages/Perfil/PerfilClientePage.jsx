import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../context/AuthContext';

const PERFIL_VAZIO = {
  alergias: '', medicamentos: '', condicoes_saude: '', gestante: false, tipo_pele: '',
  historico_procedimentos: '', observacoes: '', consentimento_lgpd: false, consentimento_em: null,
};

function extrairErro(err) {
  const d = err.response?.data;
  if (d && typeof d === 'object' && !Array.isArray(d)) {
    return Object.entries(d).map(([c, m]) => `${c}: ${Array.isArray(m) ? m.join(', ') : m}`).join(' | ');
  }
  if (err.response?.status === 403) return 'Seu perfil não tem acesso ao perfil do cliente.';
  return 'Não foi possível salvar. Tente novamente.';
}

function CampoTexto({ rotulo, valor, onChange }) {
  return (
    <div className="mb-2">
      <label className="form-label small">{rotulo}</label>
      <textarea className="form-control" rows={2} value={valor || ''} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

export default function PerfilClientePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const podeEditar = (user?.role?.nivel ?? 0) >= 3;
  const [cliente, setCliente] = useState(null);
  const [form, setForm] = useState(PERFIL_VAZIO);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');

  useEffect(() => {
    axiosClient.get(`/clientes/${id}/`).then((r) => setCliente(r.data)).catch(() => setErro('Cliente não encontrado.'));
    axiosClient.get(`/prontuario/clientes/${id}/anamnese/`)
      .then((r) => setForm({ ...PERFIL_VAZIO, ...r.data }))
      .catch((e) => setErro(extrairErro(e)));
  }, [id]);

  const set = (campo) => (valor) => setForm({ ...form, [campo]: valor });

  async function salvar(e) {
    e.preventDefault();
    setSalvando(true);
    setErro('');
    setAviso('');
    try {
      const r = await axiosClient.put(`/prontuario/clientes/${id}/anamnese/`, form);
      setForm({ ...PERFIL_VAZIO, ...r.data });
      setAviso('Perfil salvo.');
    } catch (err) {
      setErro(extrairErro(err));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div>
      <button className="btn btn-link text-decoration-none ps-0 mb-2" onClick={() => navigate(`/clientes/${id}/historico`)}>
        <i className="bi bi-arrow-left me-1"></i> Histórico
      </button>

      <h3 className="fw-bold mb-0">Perfil do Cliente</h3>
      <div className="text-muted mb-3">{cliente?.nome}</div>

      {erro && <div className="alert alert-danger py-2 small">{erro}</div>}
      {aviso && <div className="alert alert-success py-2 small">{aviso}</div>}

      <form onSubmit={salvar} className="card border-0 shadow-sm">
        <fieldset disabled={!podeEditar} className="border-0 p-0 m-0">
        <div className="card-body">
          <div className="row g-2">
            <div className="col-md-6"><CampoTexto rotulo="Gosta de:" valor={form.alergias} onChange={set('alergias')} /></div>
            <div className="col-md-6"><CampoTexto rotulo="Não gosta de:" valor={form.medicamentos} onChange={set('medicamentos')} /></div>
            <div className="col-md-6"><CampoTexto rotulo="Trabalha em qual área:" valor={form.condicoes_saude} onChange={set('condicoes_saude')} /></div>
            <div className="col-md-6"><CampoTexto rotulo="Detalhes nos procedimentos" valor={form.historico_procedimentos} onChange={set('historico_procedimentos')} /></div>
            <div className="col-md-6">
              <label className="form-label small">Hobbies, esportes, times do coração:</label>
              <input className="form-control" value={form.tipo_pele || ''} onChange={(e) => set('tipo_pele')(e.target.value)} />
            </div>
            <div className="col-md-6 d-flex align-items-end">
              <div className="form-check mb-2">
                <input className="form-check-input" type="checkbox" id="gestante" checked={!!form.gestante}
                  onChange={(e) => set('gestante')(e.target.checked)} />
                <label className="form-check-label small" htmlFor="gestante">Gosta de socializar?</label>
              </div>
            </div>
            <div className="col-12"><CampoTexto rotulo="Observações gerais" valor={form.observacoes} onChange={set('observacoes')} /></div>
          </div>

          <div className="border rounded p-3 mt-2 bg-light">
            <div className="form-check">
              <input className="form-check-input" type="checkbox" id="lgpd" checked={!!form.consentimento_lgpd}
                onChange={(e) => set('consentimento_lgpd')(e.target.checked)} />
              <label className="form-check-label small" htmlFor="lgpd">
                O cliente autorizou receber notícias em redes sociais.
              </label>
            </div>
            {form.consentimento_em && (
              <div className="small text-muted mt-1">
                Consentimento registrado em {new Date(form.consentimento_em).toLocaleString('pt-BR')}
              </div>
            )}
          </div>

          <div className="text-end mt-3">
{podeEditar && (<button type="submit" className="btn btn-primary" disabled={salvando}>
              {salvando ? 'Salvando...' : 'Salvar perfil'}
            </button>)}
          </div>
        </div>
        </fieldset>
      </form>
    </div>
  );
}
