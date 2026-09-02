import { formatarMoeda } from './formatters';

const escapeCsv = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

export const formatarNumeroBR = (value, casas = 2) => {
  const numero = Number(value);
  if (!Number.isFinite(numero)) return '';
  return numero.toLocaleString('pt-BR', {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  });
};

export const formatarDataBR = (value, incluirHora = false) => {
  if (!value) return '';
  const data = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T00:00:00`)
    : new Date(value);
  if (Number.isNaN(data.getTime())) return String(value);
  return data.toLocaleString('pt-BR', incluirHora
    ? { dateStyle: 'short', timeStyle: 'short' }
    : { dateStyle: 'short' });
};

export const exportarRelatorioCsv = ({ nomeArquivo, cabecalhos, linhas }) => {
  const conteudo = [
    cabecalhos,
    ...linhas,
  ].map((linha) => linha.map(escapeCsv).join(';')).join('\r\n');

  const blob = new Blob([`\uFEFFsep=;\r\n${conteudo}\r\n`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nomeArquivo;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export { formatarMoeda };
