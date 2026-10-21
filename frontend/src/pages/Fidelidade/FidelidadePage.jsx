import React, { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';

export default function FidelidadePage() {
  const [form, setForm] = useState({ ativo: false, percentual: '0', validade_dias: 365 });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');

  useEffect(() => {
    axiosClient.get('/fidelidade/config/').then((r) => setForm(r.data));
  }, []);

  async function salvar(e) {
    e.preventDefault();
    setSalvando(true);
    setErro('');
    setAviso('');
    try {
      const r = await axiosClient.put('/fidelidade/config/', form);
      setForm(r.data);
      setAviso('Configuração salva.');
    } catch (err) {
      setErro(err.response?.data?.detail || 'Não foi possível salvar.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div>
      <h3 className="fw-bold mb-3">Fidelidade / Cashback</h3>

      {erro && <div className="alert alert-danger py-2 small">{erro}</div>}
      {aviso && <div className="alert alert-success py-2 small">{aviso}</div>}

      <form onSubmit={salvar} className="card border-0 shadow-sm" style={{ maxWidth: 560 }}>
        <div className="card-body">
          <div className="form-check form-switch mb-3">
            <input className="form-check-input" type="checkbox" id="fidelidadeAtiva" checked={!!form.ativo}
              onChange={(e) => setForm({ ...form, ativo: e.target.checked })} />
            <label className="form-check-label" htmlFor="fidelidadeAtiva">Programa de cashback ativo</label>
          </div>

          <div className="mb-3">
            <label className="form-label small">Percentual de cashback (%)</label>
            <input type="number" step="0.01" min="0" max="100" className="form-control" value={form.percentual}
              onChange={(e) => setForm({ ...form, percentual: e.target.value })} />
            <div className="form-text">
              Quanto do valor recebido vira crédito para o cliente. Ex.: 5 em um pagamento de R$ 100 gera R$ 5 de crédito.
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label small">Validade de cada crédito (dias)</label>
            <input type="number" min="1" className="form-control" value={form.validade_dias}
              onChange={(e) => setForm({ ...form, validade_dias: e.target.value })} />
          </div>

          <div className="text-end">
            <button type="submit" className="btn btn-primary" disabled={salvando}>
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
