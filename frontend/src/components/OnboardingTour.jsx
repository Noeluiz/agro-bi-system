import { useEffect, useState } from 'react';
import { ArrowDown, ArrowRight, Check, ExternalLink, Sprout, X } from 'lucide-react';

const steps = [
  { title: 'Bem-vindo ao Agro-BI', text: 'Aqui você acompanha estoque, safras, ordens de aplicação, movimentações e resultados da operação agrícola.', target: 'dashboard', targetLabel: 'Painel principal' },
  { title: 'Vamos começar', text: 'Primeiro, cadastre um Produto no Estoque. Vamos deixar este passo aberto enquanto você realiza o cadastro.', target: 'estoque', action: 'Ir para Estoque', targetLabel: 'Menu Estoque e botão Novo Produto' },
  { title: 'Registre suas áreas', text: 'Produto criado. Agora, crie uma Safra para registrar suas áreas, culturas e acompanhar a produção.', target: 'safras', action: 'Abrir Safras', targetLabel: 'Menu Safras e botão Nova Safra' },
  { title: 'Planeje os tratamentos', text: 'Crie uma Ordem de Aplicação para registrar tratamentos, produtos, doses e parâmetros da máquina.', target: 'ordens-aplicacao', action: 'Abrir Ordens', targetLabel: 'Menu Ordens de Aplicação e botão Nova Ordem' },
  { title: 'Acompanhe os resultados', text: 'Veja seus resultados no Dashboard e consulte todas as entradas e saídas em Movimentações.', target: 'movimentacoes', action: 'Abrir Movimentações', targetLabel: 'Menu Movimentações' },
];

const storageKey = (email) => `agro_bi_onboarding_seen:${email}`;

function lerProgresso(email) {
  if (!email) return { seen: false, currentStep: 1 };
  const salvo = localStorage.getItem(storageKey(email));
  if (!salvo) return { seen: false, currentStep: 1 };
  if (salvo === 'true') return { seen: false, currentStep: 2, retry: true };
  try {
    const progresso = JSON.parse(salvo);
    if (progresso.paused && progresso.currentStep === 2) {
      return { ...progresso, seen: false, retry: true };
    }
    return progresso;
  } catch {
    return { seen: false, currentStep: 1 };
  }
}

export default function OnboardingTour({ userEmail, onNavigate, onHighlight, onPause, resumeSignal }) {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(1);
  const [retryMessage, setRetryMessage] = useState('');

  const salvarProgresso = (dados) => {
    if (userEmail) localStorage.setItem(storageKey(userEmail), JSON.stringify(dados));
  };

  useEffect(() => {
    const progresso = lerProgresso(userEmail);
    setStep(Math.min(Math.max(progresso.currentStep || 1, 1), steps.length));
    setRetryMessage(progresso.retry ? 'Você ainda não criou um produto. Vamos tentar de novo.' : '');
    setVisible(!progresso.seen || Boolean(progresso.retry));
  }, [userEmail]);

  useEffect(() => {
    if (!resumeSignal) return;
    setStep(resumeSignal.step);
    setRetryMessage(resumeSignal.message || '');
    setVisible(true);
    salvarProgresso({ seen: true, currentStep: resumeSignal.step });
  }, [resumeSignal]);

  const currentStep = steps[step - 1];
  const lastStep = step === steps.length;

  useEffect(() => {
    if (visible && currentStep) onHighlight?.(currentStep.target);
    return () => onHighlight?.(null);
  }, [visible, currentStep, onHighlight]);

  const finalizar = (skipped = false) => {
    salvarProgresso({ seen: true, currentStep: step, skipped, completed: !skipped });
    onHighlight?.(null);
    setVisible(false);
  };

  const irParaAlvo = () => {
    if (step === 2) {
      salvarProgresso({ seen: true, currentStep: 2, paused: true });
      onPause?.();
      onHighlight?.(null);
      setVisible(false);
      onNavigate(currentStep.target);
      return;
    }
    onNavigate(currentStep.target);
    finalizar();
  };

  const avancar = () => {
    if (lastStep) return finalizar();
    const proximoPasso = step + 1;
    setStep(proximoPasso);
    setRetryMessage('');
    salvarProgresso({ seen: true, currentStep: proximoPasso });
  };

  if (!visible || !currentStep) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden relative">
        <div className="bg-emerald-800 px-6 py-5 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3"><div className="w-11 h-11 rounded-xl bg-emerald-700 text-emerald-100 flex items-center justify-center"><Sprout className="w-6 h-6" aria-hidden="true" /></div><div><p className="text-emerald-200 text-xs font-semibold uppercase tracking-wide">Guia rápido</p><h2 id="onboarding-title" className="text-xl font-bold text-white">{currentStep.title}</h2></div></div>
          <button type="button" onClick={() => finalizar(true)} className="p-1.5 rounded-lg text-emerald-100 hover:bg-emerald-700" title="Fechar tutorial" aria-label="Fechar tutorial"><X className="w-5 h-5" aria-hidden="true" /></button>
        </div>
        <div className="p-6">
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-800 text-sm font-semibold"><ArrowDown className="w-5 h-5 animate-bounce shrink-0" aria-hidden="true" /><span>Alvo: {currentStep.targetLabel}</span></div>
          {retryMessage && <p className="mb-3 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-sm font-medium text-amber-800">{retryMessage}</p>}
          <p className="text-slate-700 leading-relaxed min-h-20">{currentStep.text}</p>
          <div className="flex items-center gap-1.5 mt-6" aria-label={`Passo ${step} de ${steps.length}`}>{steps.map((item, index) => <span key={item.title} className={`h-1.5 flex-1 rounded-full ${index < step ? 'bg-emerald-700' : 'bg-slate-200'}`} />)}</div>
          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 mt-6"><button type="button" onClick={() => finalizar(true)} className="text-sm text-slate-500 hover:text-slate-700 underline underline-offset-2 text-left">Pular tutorial</button><div className="flex items-center justify-end gap-3"><span className="text-sm text-slate-500">Passo {step} de {steps.length}</span>{currentStep.action && <button type="button" onClick={irParaAlvo} className="inline-flex items-center gap-2 px-3 py-2 border border-emerald-700 text-emerald-800 rounded-lg hover:bg-emerald-50"><ExternalLink className="w-4 h-4" aria-hidden="true" />{currentStep.action}</button>}<button type="button" onClick={avancar} className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 transition">{lastStep ? <Check className="w-4 h-4" aria-hidden="true" /> : <ArrowRight className="w-4 h-4" aria-hidden="true" />}{lastStep ? 'Concluir' : 'Próximo'}</button></div></div>
        </div>
      </div>
    </div>
  );
}
