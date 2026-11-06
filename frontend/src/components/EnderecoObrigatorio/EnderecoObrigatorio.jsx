import React, { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../context/AuthContext';

const VAZIO = { cep: '', pais: 'Brasil', endereco: '', numero: '', bairro: '', cidade: '', estado: '' };
const CAMPOS_OBRIGATORIOS = Object.keys(VAZIO);

function formatarCep(valor) {
  const digitos = valor.replace(/\D/g, '').slice(0, 8);
  return digitos.length > 5 ? `${digitos.slice(0, 5)}-${digitos.slice(5)}` : digitos;
}

/**
 * Modal de endereço OBRIGATÓRIO. Aparece quando o endereço do negócio (Dados do Negócio)
 * ou do pagador do boleto está incompleto. Não tem botão de fechar, não fecha clicando fora
 * nem com Esc: só some depois que o endereço é salvo. Única saída alternativa: "Sair".
 * Só é exigido de Gerente ou superior (quem pode salvar o endereço).
 */
export default function EnderecoObrigatorio() {
  const { logout } = useAuth();
  const [visivel, setVisivel] = useState(false);
  const [form, setForm] = useState(VAZIO);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [buscandoCep, setBuscandoCep] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('admstudio_access')) return;
    axiosClient.get('/assinatura/endereco/')
      .then((r) => {
        if (!r.data.completo && r.data.pode_editar) {
          setForm({ ...VAZIO, ...r.data.endereco });
          setVisivel(true);
        }
      })
      .catch(() => {});
  }, []);

  async function buscarCep(digitos) {
    setBuscandoCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digitos}/json/`);
      const dados = await res.json();
      if (!dados.erro) {
        setForm((f) => ({
          ...f,
          endereco: dados.logradouro || f.endereco,
          bairro: dados.bairro || f.bairro,
          cidade: dados.localidade || f.cidade,
          estado: dados.uf || f.estado,
        }));
      }
    } catch {
      // Sem internet ou ViaCEP fora do ar: o preenchimento manual continua valendo.
    } finally {
      setBuscandoCep(false);
    }
  }

  function mudarCep(valor) {
    const formatado = formatarCep(valor);
    setForm((f) => ({ ...f, cep: formatado }));
    if (formatado.replace(/\D/g, '').length === 8) buscarCep(formatado.replace(/\D/g, ''));
  }

  function mudar(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  const completo = CAMPOS_OBRIGATORIOS.every((c) => String(form[c] || '').trim())
    && form.cep.replace(/\D/g, '').length === 8
    && form.estado.trim().length === 2;

  async function salvar(e) {
    e.preventDefault();
    if (!completo) return;
    setErro('');
    setSalvando(true);
    try {
      await axiosClient.put('/assinatura/endereco/', form);
      setVisivel(false);
    } catch (err) {
      const dados = err.response?.data;
      if (dados && typeof dados === 'object' && !Array.isArray(dados)) {
        setErro(Object.values(dados).flat().join(' '));
      } else {
        setErro('Não foi possível salvar o endereço. Tente novamente.');
      }
    } finally {
      setSalvando(false);
    }
  }

  if (!visivel) return null;

  return (
    <div className="modal d-block" role="dialog" aria-modal="true"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 2000, overflowY: 'auto' }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title fw-bold">
              <i className="bi bi-geo-alt me-2"></i>Complete o endereço do seu negócio
            </h5>
          </div>
          <form onSubmit={salvar}>
            <div className="modal-body">
              <div className="alert alert-warning py-2 small">
                Para continuar, informe o endereço completo. Ele é obrigatório para emitir o boleto da sua assinatura.
              </div>
              {erro && <div className="alert alert-danger py-2 small">{erro}</div>}

              <div className="row g-2 mb-2">
                <div className="col-md-4">
                  <label className="form-label small fw-semibold">
                    CEP * {buscandoCep && <span className="spinner-border spinner-border-sm ms-1"></span>}
                  </label>
                  <input className="form-control" placeholder="00000-000" autoFocus required
                    value={form.cep} onChange={(e) => mudarCep(e.target.value)} />
                  <div className="form-text">Digite o CEP para preencher o endereço automaticamente.</div>
                </div>
                <div className="col-md-8">
                  <label className="form-label small fw-semibold">País *</label>
                  <input className="form-control" required value={form.pais}
                    onChange={(e) => mudar('pais', e.target.value)} />
                </div>
              </div>
              <div className="row g-2 mb-2">
                <div className="col-md-9">
                  <label className="form-label small fw-semibold">Endereço *</label>
                  <input className="form-control" required maxLength={150} value={form.endereco}
                    onChange={(e) => mudar('endereco', e.target.value)} />
                </div>
                <div className="col-md-3">
                  <label className="form-label small fw-semibold">Número *</label>
                  <input className="form-control" required maxLength={10} placeholder="Ou S/N" value={form.numero}
                    onChange={(e) => mudar('numero', e.target.value)} />
                </div>
              </div>
              <div className="row g-2 mb-2">
                <div className="col-md-5">
                  <label className="form-label small fw-semibold">Bairro *</label>
                  <input className="form-control" required maxLength={100} value={form.bairro}
                    onChange={(e) => mudar('bairro', e.target.value)} />
                </div>
                <div className="col-md-5">
                  <label className="form-label small fw-semibold">Cidade *</label>
                  <input className="form-control" required maxLength={100} value={form.cidade}
                    onChange={(e) => mudar('cidade', e.target.value)} />
                </div>
                <div className="col-md-2">
                  <label className="form-label small fw-semibold">UF *</label>
                  <input className="form-control" required maxLength={2} value={form.estado}
                    onChange={(e) => mudar('estado', e.target.value.toUpperCase())} />
                </div>
              </div>
            </div>
            <div className="modal-footer justify-content-between">
              <button type="button" className="btn btn-link text-muted" onClick={logout}>
                <i className="bi bi-box-arrow-left me-1"></i>Sair
              </button>
              <button type="submit" className="btn btn-primary" disabled={!completo || salvando}>
                {salvando ? 'Salvando...' : 'Salvar endereço'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
