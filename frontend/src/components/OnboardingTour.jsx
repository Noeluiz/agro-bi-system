import { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, Check, ExternalLink, Sprout, X } from 'lucide-react';

const baseSteps = [
  { id: 'dashboard', title: 'Dashboard: sua visão executiva', text: 'Comece pelos cartões de Faturamento, Lucro, Margem, Custo por hectare, Custo por saca, Produtividade e Estoque. Eles resumem os dados registrados nos demais módulos. Logo abaixo, o gráfico de fluxo de caixa compara receitas e despesas por período. Use o Dashboard para acompanhar tendências e decidir onde investigar.', action: 'Abrir Dashboard' },
  { id: 'estoque', title: 'Estoque: encontre e cadastre insumos', text: 'Use a busca para localizar produtos pelo nome e os filtros de Categoria e Fornecedor para reduzir a lista. Para cadastrar, clique em Novo Produto: informe nome, categoria, fornecedor, unidade de medida, estoque atual, estoque mínimo, preço de custo e preço de venda. O botão Exportar CSV gera uma tabela limpa, compatível com Excel, com valores em padrão brasileiro.', action: 'Abrir Estoque' },
  { id: 'safras', title: 'Safras: organize suas áreas', text: 'Uma safra representa uma cultura cultivada em uma área e período. Clique em Nova Safra e preencha nome, cultura, data de início, data de fim quando houver, hectares plantados e produção. Depois, abra uma safra para consultar detalhes e aplicações. A safra pode ser selecionada na criação de uma Ordem de Aplicação para preencher a área e a cultura.', action: 'Abrir Safras' },
  { id: 'ordens-aplicacao', title: 'Ordens de Aplicação: planeje tratamentos', text: 'Uma ordem é o plano operacional de aplicação de insumos. Clique em Nova Ordem, selecione a safra ou informe fazenda, cultura, variedade, datas, tipo e modelo da máquina, operador, tanque, vazão, pressão, velocidade e bico. Em Produtos da aplicação, escolha cada produto e informe a dose por hectare. O sistema calcula a quantidade total, divide tanques cheios e parcial e baixa o estoque após criar.', action: 'Abrir Ordens' },
  { id: 'ordens-pdf', title: 'PDF: registre e compartilhe a operação', text: 'Na lista de Ordens, use Baixar PDF para gerar o documento profissional da ordem. Ele contém identificação da fazenda, parâmetros da máquina, divisão de tanques, doses, aviso de EPI, rastreabilidade, cabeçalho institucional e paginação. Guarde o PDF para consulta operacional e auditoria.', action: 'Ver Ordens' },
  { id: 'financeiro', title: 'Financeiro: registre receitas e despesas', text: 'No Financeiro, Adicionar Lançamento abre o cadastro de uma Receita ou Despesa. Informe tipo, valor, categoria, data e descrição. Os cartões mostram receitas, despesas e saldo. Use os filtros por tipo, data inicial e data final para analisar um período; Exportar CSV gera a tabela filtrada para o Excel.', action: 'Abrir Financeiro', admin: true },
  { id: 'rh', title: 'Recursos Humanos: acompanhe a equipe', text: 'Em RH, cadastre funcionários informando nome, CPF quando aplicável, cargo, salário base e data de admissão. A listagem mostra status e permite inativar sem apagar o histórico. O soft delete mantém o registro para auditoria e evita perda de informação.', action: 'Abrir RH', admin: true },
  { id: 'usuarios', title: 'Usuários: controle de acesso', text: 'Somente ADMIN gerencia usuários. Em Novo usuário, informe nome, e-mail, senha e papel: ADMIN, GERENTE ou OPERADOR. Use Editar para atualizar dados e Bloquear/Desbloquear para controlar o acesso sem apagar a conta. Conceda apenas o papel necessário para cada pessoa.', action: 'Abrir Usuários', admin: true },
  { id: 'movimentacoes', title: 'Movimentações: rastreie o estoque', text: 'Esta tela consolida o histórico de entradas e saídas. Compras aparecem como ENTRADA; itens consumidos por Ordens de Aplicação aparecem como SAÍDA. Consulte produto, quantidade, data e referência para entender por que o estoque mudou.', action: 'Abrir Movimentações' },
  { id: 'alertas', title: 'Alertas: trate pendências', text: 'A tela de Alertas mostra avisos de estoque e outras pendências. Alterne entre Todos, Pendentes e Resolvidos. Ao concluir uma pendência, clique em Resolver para registrar o tratamento; use Exportar CSV para compartilhar a lista e os filtros para encontrar alertas específicos.', action: 'Abrir Alertas' },
  { id: 'ajuda', title: 'Ajuda: reveja quando quiser', text: 'A tela Ajuda reúne este tour e o espaço reservado para o vídeo tutorial da empresa. Você pode reiniciar o guia a qualquer momento. Ao concluir, o progresso fica salvo por usuário e o sistema não interrompe seu trabalho novamente.', action: 'Abrir Ajuda' },
];

const keyFor = (email) => `agro_bi_onboarding_seen:${email}`;

function readProgress(email) {
  if (!email) return { seen: false, currentStep: 0 };
  const raw = localStorage.getItem(keyFor(email));
  if (!raw || raw === 'true') return { seen: false, currentStep: 0 };
  try { return JSON.parse(raw); } catch { return { seen: false, currentStep: 0 }; }
}

export default function OnboardingTour({ role, userEmail, onNavigate, onHighlight, onPause, resumeSignal }) {
  const steps = useMemo(() => baseSteps.filter((step) => !step.admin || role === 'ADMIN'), [role]);
  const [visible, setVisible] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const save = (progress) => {
    if (userEmail) localStorage.setItem(keyFor(userEmail), JSON.stringify(progress));
  };

  useEffect(() => {
    const progress = readProgress(userEmail);
    const nextIndex = Math.min(Math.max(progress.currentStep || 0, 0), Math.max(steps.length - 1, 0));
    setStepIndex(nextIndex);
    setVisible(!progress.seen);
  }, [userEmail, steps.length]);

  useEffect(() => {
    if (!resumeSignal) return;
    const nextIndex = Math.min(Math.max(resumeSignal.step || 0, 0), Math.max(steps.length - 1, 0));
    setStepIndex(nextIndex);
    setVisible(true);
    save({ seen: false, currentStep: nextIndex });
  }, [resumeSignal]);

  const current = steps[stepIndex];

  useEffect(() => {
    if (!visible || !current) return undefined;
    const targetId = current.id === 'ordens-pdf' ? 'ordens-aplicacao' : current.id;
    const target = document.querySelector(`[data-tour="${targetId}"]`);
    if (target) {
      target.setAttribute('data-tour-active', 'true');
      target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    }
    onHighlight?.(current.id);
    return () => {
      target?.removeAttribute('data-tour-active');
      onHighlight?.(null);
    };
  }, [visible, current, onHighlight]);

  const finish = (skipped = false) => {
    save({ seen: true, currentStep: stepIndex, completed: !skipped, skipped });
    setVisible(false);
    onHighlight?.(null);
  };

  const goToModule = () => {
    if (!current) return;
    save({ seen: false, currentStep: stepIndex });
    onPause?.(stepIndex);
    onNavigate(current.id === 'ordens-pdf' ? 'ordens-aplicacao' : current.id);
    setVisible(false);
  };

  const next = () => {
    if (stepIndex >= steps.length - 1) return finish();
    const nextIndex = stepIndex + 1;
    setStepIndex(nextIndex);
    save({ seen: false, currentStep: nextIndex });
  };

  const previous = () => {
    if (stepIndex === 0) return;
    const previousIndex = stepIndex - 1;
    setStepIndex(previousIndex);
    save({ seen: false, currentStep: previousIndex });
  };

  if (!visible || !current) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        <header className="bg-emerald-800 px-5 sm:px-6 py-5 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3"><div className="w-11 h-11 rounded-xl bg-emerald-700 text-emerald-100 flex items-center justify-center"><Sprout className="w-6 h-6" /></div><div><p className="text-emerald-200 text-xs font-semibold uppercase tracking-wide">Guia completo do sistema</p><h2 id="onboarding-title" className="text-xl font-bold text-white">{current.title}</h2></div></div>
          <button type="button" onClick={() => finish(true)} className="p-2 rounded-lg text-emerald-100 hover:bg-emerald-700" aria-label="Fechar e pular tutorial"><X className="w-5 h-5" /></button>
        </header>
        <div className="p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-800 text-sm font-semibold"><ArrowDown className="w-5 h-5 animate-bounce shrink-0" /><span>Veja o menu ou controle destacado em verde.</span></div>
          <p className="text-slate-700 leading-relaxed min-h-28">{current.text}</p>
          <div className="flex items-center gap-1.5 mt-5">{steps.map((item, index) => <span key={item.id} className={`h-1.5 flex-1 rounded-full ${index <= stepIndex ? 'bg-emerald-700' : 'bg-slate-200'}`} />)}</div>
          <div className="flex flex-col-reverse md:flex-row md:items-center md:justify-between gap-3 mt-6"><button type="button" onClick={() => finish(true)} className="text-sm text-slate-500 hover:text-slate-700 underline underline-offset-2 text-left">Pular tutorial</button><div className="flex flex-wrap items-center justify-end gap-2"><span className="text-sm text-slate-500 mr-1">{stepIndex + 1} de {steps.length}</span><button type="button" onClick={previous} disabled={stepIndex === 0} className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-300 text-slate-700 rounded-lg disabled:opacity-40"><ArrowLeft className="w-4 h-4" />Voltar</button><button type="button" onClick={goToModule} className="inline-flex items-center gap-1.5 px-3 py-2 border border-emerald-700 text-emerald-800 rounded-lg hover:bg-emerald-50"><ExternalLink className="w-4 h-4" />{current.action}</button><button type="button" onClick={next} className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800">{stepIndex === steps.length - 1 ? <Check className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}{stepIndex === steps.length - 1 ? 'Concluir' : 'Próximo'}</button></div></div>
        </div>
      </div>
    </div>
  );
}
