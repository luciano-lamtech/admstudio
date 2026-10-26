import React from 'react';
import { Link } from 'react-router-dom';
import { TERMOS, PRIVACIDADE, ULTIMA_ATUALIZACAO } from './conteudo';

export default function LegalPage({ tipo }) {
  const doc = tipo === 'privacidade'
    ? { titulo: 'Política de Privacidade', secoes: PRIVACIDADE }
    : { titulo: 'Termos de Uso', secoes: TERMOS };

  return (
    <div className="d-flex justify-content-center py-4 px-3" style={{ background: '#1e2a38', minHeight: '100vh' }}>
      <div className="card border-0 shadow-lg" style={{ maxWidth: 820, width: '100%', borderRadius: 16 }}>
        <div className="card-body p-4 p-md-5">
          <h2 className="fw-bold mb-1" style={{ color: '#1e2a38' }}>{doc.titulo}</h2>
          <div className="small text-muted mb-4">Última atualização: {ULTIMA_ATUALIZACAO}</div>

          {doc.secoes.map((secao) => (
            <section key={secao.titulo} className="mb-4">
              <h5 className="fw-bold">{secao.titulo}</h5>
              {secao.paragrafos.map((p, i) => (
                <p key={i} className="mb-2" style={{ whiteSpace: 'pre-line' }}>{p}</p>
              ))}
            </section>
          ))}

          <div className="d-flex flex-wrap gap-3 small mt-4 pt-3 border-top">
            <Link to="/termos">Termos de Uso</Link>
            <Link to="/privacidade">Política de Privacidade</Link>
            <Link to="/cadastro">Voltar ao cadastro</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
