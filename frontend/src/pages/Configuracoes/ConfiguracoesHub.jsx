import React from 'react';
import { useNavigate } from 'react-router-dom';

const CARDS = [
  {
    titulo: 'Dados do Negócio',
    descricao: 'Nome, endereço, contato e informações do assinante',
    icone: 'bi-building',
    cor: '#f59e0b',
    rota: '/configuracoes/negocio',
  },
  {
    titulo: 'Preferências do Sistema',
    descricao: 'Ajustes gerais de funcionamento do ADMSTUDIO',
    icone: 'bi-sliders',
    cor: '#0ea5e9',
    rota: '/configuracoes/preferencias',
  },
];

export default function ConfiguracoesHub() {
  const navigate = useNavigate();

  return (
    <div>
      <h3 className="fw-bold mb-4">Configurações</h3>
      <div className="row row-cols-1 row-cols-md-3 g-3">
        {CARDS.map((c) => (
          <div className="col" key={c.rota}>
            <div
              className="card border-0 shadow-sm h-100"
              style={{ cursor: 'pointer', borderRadius: '12px', transition: 'transform 0.15s' }}
              onClick={() => navigate(c.rota)}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-3px)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              <div className="card-body text-center py-4">
                <div
                  className="d-flex align-items-center justify-content-center mx-auto mb-3"
                  style={{ width: 56, height: 56, borderRadius: '50%', backgroundColor: `${c.cor}22` }}
                >
                  <i className={`bi ${c.icone}`} style={{ fontSize: '26px', color: c.cor }}></i>
                </div>
                <div className="fw-bold mb-1">{c.titulo}</div>
                <div className="small text-muted">{c.descricao}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
