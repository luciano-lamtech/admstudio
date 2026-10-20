import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';

const SITUACAO = {
  ativo: { label: 'Ativo', cor: 'text-bg-success' },
  esgotado: { label: 'Esgotado', cor: 'text-bg-secondary' },
  vencido: { label: 'Vencido', cor: 'text-bg-warning' },
  cancelado: { label: 'Cancelado', cor: 'text-bg-danger' },
};

function formatarData(iso) {
  return iso ? new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR') : '—';
}

function mensagem(err) {
  return err.response?.data?.detail || 'Não foi possível concluir. Tente novamente.';
}

export default function ClientePacotesPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cliente, setCliente] = useState(null);
  const [catalogo, setCatalogo] = useState([]);
  const [lista, setLista] = useState([]);
  const [pacoteVenda, setPacoteVenda] = useState('');
  const [vendendo, setVendendo] = useState(false);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');

  async function carregar() {
    try {
      const r = await axiosClient.get(`/pacotes/clientes/${id}/`);
      setLista(r.data);
    } catch (err) {
      setErro(mensagem(err));
    }
  }

  useEffect(() => {
    axiosClient.get(`/clientes/${id}/`)
      .then((r) => setCliente(r.data))
      .catch(() => setErro('Cliente não encontrado.'));
    axiosClient.get('/pacotes/', { params: { ativo: 'true' } })
      .then((r) => setCatalogo(r.data.results || r.data));
    carregar();
  }, [id]); // eslint-disable-line

  async function vender() {
    if (!pacoteVenda) return;
    setVendendo(true);
    setErro('');
    setAviso('');
    try {
      await axiosClient.post('/pacotes/vender/', { cliente: id, pacote: pacoteVenda });
      setAviso('Pacote vendido. O valor entrou no Caixa como pendente.');
      setPacoteVenda('');
      carregar();
    } catch (err) {
      setErro(mensagem(err));
    } finally {
      setVendendo(false);
    }
  }

  async function usarSessao(cp) {
    const observacao = window.prompt('Observação da sessão (opcional):', '');
    if (observacao === null) return;
    setErro('');
    try {
      await axiosClient.post(`/pacotes/cliente-pacotes/${cp.id}/usar/`, { observacao });
      carregar();
    } catch (err) {
      setErro(mensagem(err));
    }
  }

  return (
    <div>
      <button className="btn btn-link text-decoration-none ps-0 mb-2" onClick={() => navigate(`/clientes/${id}/historico`)}>
        <i className="bi bi-arrow-left me-1"></i> Histórico
      </button>

      <h3 className="fw-bold mb-0">Pacotes</h3>
      <div className="text-muted mb-3">{cliente?.nome}</div>

      {erro && <div className="alert alert-danger py-2 small">{erro}</div>}
      {aviso && <div className="alert alert-success py-2 small">{aviso}</div>}

      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body d-flex gap-2 flex-wrap">
          <select className="form-select" style={{ maxWidth: 360 }} value={pacoteVenda}
            onChange={(e) => setPacoteVenda(e.target.value)}>
            <option value="">Vender um pacote...</option>
            {catalogo.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome} — R$ {parseFloat(p.preco).toFixed(2).replace('.', ',')}
              </option>
            ))}
          </select>
          <button className="btn btn-primary" disabled={!pacoteVenda || vendendo} onClick={vender}>
            {vendendo ? 'Vendendo...' : 'Vender pacote'}
          </button>
        </div>
      </div>

      {lista.length === 0 && (
        <div className="card border-0 shadow-sm text-center text-muted py-4">Este cliente ainda não tem pacotes.</div>
      )}

      <div className="d-flex flex-column gap-3">
        {lista.map((cp) => (
          <div key={cp.id} className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
                <div>
                  <div className="fw-bold">{cp.nome_pacote}</div>
                  <div className="small text-muted">
                    Comprado em {formatarData(cp.comprado_em)} · válido até {formatarData(cp.validade_ate)}
                  </div>
                </div>
                <span className={`badge rounded-pill ${SITUACAO[cp.situacao]?.cor || 'text-bg-secondary'}`}>
                  {SITUACAO[cp.situacao]?.label || cp.situacao}
                </span>
              </div>

              <div className="mt-3">
                <strong>Saldo: {cp.saldo}</strong> de {cp.sessoes_total} sessão(ões)
                <span className="small text-muted"> · {cp.sessoes_usadas} usada(s)</span>
              </div>

              {cp.situacao === 'ativo' && (
                <button className="btn btn-sm btn-outline-success mt-2" onClick={() => usarSessao(cp)}>
                  <i className="bi bi-check2-circle me-1"></i> Usar uma sessão
                </button>
              )}

              {cp.usos.length > 0 && (
                <ul className="small text-muted mt-3 mb-0 ps-3">
                  {cp.usos.map((u) => (
                    <li key={u.id}>
                      {formatarData(u.data)}{u.observacao ? ` — ${u.observacao}` : ''}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
