import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';

const VAZIO = {
  razao_social: '', nome_fantasia: '', cnpj_cpf: '', tipo_negocio: 'salao',
  nome_responsavel: '', cpf_responsavel: '', email: '', telefone: '', senha: '', confirmar_senha: '', aceite_termos: false,
};

const TIPOS = [
  { valor: 'salao', label: 'Salão de Beleza' },
  { valor: 'barbearia', label: 'Barbearia' },
  { valor: 'clinica_estetica', label: 'Clínica de Estética' },
  { valor: 'outro', label: 'Outro' },
];

export default function CadastroPage() {
  const [form, setForm] = useState(VAZIO);
  const [erros, setErros] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState(null);
  const [erroGeral, setErroGeral] = useState('');

  const set = (campo) => (e) => setForm({ ...form, [campo]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  async function enviar(e) {
    e.preventDefault();
    setErros({});
    setErroGeral('');
    setEnviando(true);
    try {
      const r = await axiosClient.post('/publico/cadastro/', form);
      setSucesso(r.data);
    } catch (err) {
      const d = err.response?.data;
      if (d && typeof d === 'object' && !d.detail) {
        setErros(d);
      } else {
        setErroGeral(d?.detail || 'Não foi possível concluir o cadastro. Tente novamente.');
      }
    } finally {
      setEnviando(false);
    }
  }

  const campoErro = (campo) => erros[campo]?.[0];

  if (sucesso) {
    return (
      <div className="d-flex align-items-center justify-content-center min-vh-100" style={{ background: '#1e2a38' }}>
        <div className="card border-0 shadow-lg" style={{ width: 460, borderRadius: 16 }}>
          <div className="card-body p-4 text-center">
            <i className="bi bi-check-circle-fill text-success" style={{ fontSize: 48 }}></i>
            <h4 className="fw-bold mt-3">Cadastro criado!</h4>
            <p className="text-muted">{sucesso.mensagem}</p>
            <div className="alert alert-light text-start small">
              <div><strong>CPF/CNPJ:</strong> {sucesso.cnpj_cpf}</div>
              <div><strong>E-mail:</strong> {sucesso.email}</div>
            </div>
            <Link to="/login" className="btn btn-primary w-100">Ir para o login</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 py-4" style={{ background: '#1e2a38' }}>
      <div className="card border-0 shadow-lg" style={{ width: 520, borderRadius: 16 }}>
        <div className="card-body p-4">
          <div className="text-center mb-3">
            <h2 className="fw-bold" style={{ color: '#1e2a38' }}>ADM<span className="text-primary">STUDIO</span></h2>
            <p className="text-muted small mb-0">Crie a conta do seu estabelecimento</p>
          </div>

          {erroGeral && <div className="alert alert-danger py-2 small">{erroGeral}</div>}

          <form onSubmit={enviar}>
            <div className="mb-2">
              <label className="form-label small fw-semibold">Nome da empresa</label>
              <input className={`form-control ${campoErro('razao_social') ? 'is-invalid' : ''}`} required
                value={form.razao_social} onChange={set('razao_social')} />
              <div className="invalid-feedback">{campoErro('razao_social')}</div>
            </div>

            <div className="row g-2 mb-2">
              <div className="col-md-6">
                <label className="form-label small fw-semibold">Nome fantasia</label>
                <input className="form-control" value={form.nome_fantasia} onChange={set('nome_fantasia')} />
              </div>
              <div className="col-md-6">
                <label className="form-label small fw-semibold">Tipo de negócio</label>
                <select className="form-select" value={form.tipo_negocio} onChange={set('tipo_negocio')}>
                  {TIPOS.map((t) => <option key={t.valor} value={t.valor}>{t.label}</option>)}
                </select>
              </div>
            </div>

            <div className="row g-2 mb-2">
              <div className="col-md-6">
                <label className="form-label small fw-semibold">CPF ou CNPJ</label>
                <input className={`form-control ${campoErro('cnpj_cpf') ? 'is-invalid' : ''}`} required
                  inputMode="numeric" placeholder="Somente números"
                  value={form.cnpj_cpf} onChange={(e) => setForm({ ...form, cnpj_cpf: e.target.value.replace(/\D/g, '').slice(0, 14) })} />
                <div className="invalid-feedback">{campoErro('cnpj_cpf')}</div>
              </div>
              <div className="col-md-6">
                <label className="form-label small fw-semibold">Telefone / WhatsApp</label>
                <input className="form-control" value={form.telefone} onChange={set('telefone')} />
              </div>
            </div>

            <div className="mb-2">
              <label className="form-label small fw-semibold">Nome do responsável</label>
              <input className={`form-control ${campoErro('nome_responsavel') ? 'is-invalid' : ''}`} required
                value={form.nome_responsavel} onChange={set('nome_responsavel')} />
              <div className="invalid-feedback">{campoErro('nome_responsavel')}</div>
            </div>

            <div className="mb-2">
              <label className="form-label small fw-semibold">CPF do responsável (quem paga a mensalidade)</label>
              <input className={`form-control ${campoErro('cpf_responsavel') ? 'is-invalid' : ''}`} required
                inputMode="numeric" placeholder="Somente números"
                value={form.cpf_responsavel} onChange={(e) => setForm({ ...form, cpf_responsavel: e.target.value.replace(/\D/g, '').slice(0, 11) })} />
              <div className="invalid-feedback">{campoErro('cpf_responsavel')}</div>
            </div>

            <div className="mb-2">
              <label className="form-label small fw-semibold">E-mail de acesso</label>
              <input type="email" className={`form-control ${campoErro('email') ? 'is-invalid' : ''}`} required
                value={form.email} onChange={set('email')} />
              <div className="invalid-feedback">{campoErro('email')}</div>
            </div>

            <div className="row g-2 mb-2">
              <div className="col-md-6">
                <label className="form-label small fw-semibold">Senha (mínimo 8 caracteres)</label>
                <input type="password" className={`form-control ${campoErro('senha') ? 'is-invalid' : ''}`} required
                  value={form.senha} onChange={set('senha')} />
                <div className="invalid-feedback">{campoErro('senha')}</div>
              </div>
              <div className="col-md-6">
                <label className="form-label small fw-semibold">Confirmar senha</label>
                <input type="password" className={`form-control ${campoErro('confirmar_senha') ? 'is-invalid' : ''}`} required
                  value={form.confirmar_senha} onChange={set('confirmar_senha')} />
                <div className="invalid-feedback">{campoErro('confirmar_senha')}</div>
              </div>
            </div>

            <div className="form-check mb-3">
              <input className={`form-check-input ${campoErro('aceite_termos') ? 'is-invalid' : ''}`} type="checkbox"
                id="aceite" checked={!!form.aceite_termos} onChange={set('aceite_termos')} />
              <label className="form-check-label small" htmlFor="aceite">
                Li e aceito os termos de uso e a política de privacidade.
              </label>
              <div className="invalid-feedback d-block">{campoErro('aceite_termos')}</div>
            </div>

            <button type="submit" className="btn btn-primary w-100 py-2 fw-semibold" disabled={enviando}>
              {enviando ? 'Criando sua conta...' : 'Criar conta'}
            </button>
          </form>

          <div className="text-center mt-3 small">
            Já tem conta? <Link to="/login">Entrar</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
