const moedaBRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

/** Formata valores monetários para o padrão brasileiro, como R$ 2.000,00. */
export function formatarMoeda(valor) {
  const numero = Number(valor);
  return moedaBRL.format(Number.isFinite(numero) ? numero : 0);
}
