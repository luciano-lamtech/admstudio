// Funções de data usando SEMPRE o horário local do navegador.
// Evite toISOString() para obter "a data de hoje": ele converte para UTC e,
// à noite no Brasil (após ~21h), devolve o dia seguinte.

function doisDigitos(n) {
  return String(n).padStart(2, '0');
}

// Date -> 'YYYY-MM-DD' (data local)
export function dataLocalISO(data = new Date()) {
  return `${data.getFullYear()}-${doisDigitos(data.getMonth() + 1)}-${doisDigitos(data.getDate())}`;
}

export function hojeISO() {
  return dataLocalISO(new Date());
}

export function primeiroDiaMesISO() {
  const d = new Date();
  return dataLocalISO(new Date(d.getFullYear(), d.getMonth(), 1));
}
