import { Sprout } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TermosUso() {
  return (
    <main className="min-h-screen bg-stone-50 py-10 px-4">
      <section className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-sm p-6 md:p-10">
        <Link to="/" className="inline-flex items-center gap-2 text-emerald-800 font-bold hover:text-emerald-700">
          <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-800">
            <Sprout className="w-5 h-5 text-emerald-100" aria-hidden="true" />
          </span>
          Agro-BI
        </Link>

        <h1 className="text-3xl font-bold text-emerald-800 mt-8">Termos de Uso</h1>
        <p className="text-slate-500 mt-2">Última atualização: agosto de 2026</p>

        <div className="mt-8 space-y-7 text-slate-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-2">1. Aceitação dos termos</h2>
            <p>
              Ao acessar ou utilizar o Agro-BI, o usuário declara que leu e concorda com estes Termos de Uso. Caso não concorde com alguma condição, não deverá utilizar o sistema.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-2">2. Responsabilidades do usuário</h2>
            <p>
              O usuário deve manter seu login e senha seguros, não compartilhar credenciais e comunicar imediatamente à administração qualquer suspeita de acesso indevido. Cada conta deve ser utilizada exclusivamente pelo seu titular.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-2">3. Uso aceitável</h2>
            <p>
              O Agro-BI destina-se à gestão agrícola, incluindo o controle de estoque, safras, aplicações, movimentações e informações administrativas. É proibido utilizar o sistema para fins ilícitos, para violar direitos de terceiros, tentar obter acesso não autorizado ou comprometer a segurança e o funcionamento da plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-2">4. Suspensão e bloqueio</h2>
            <p>
              A administração responsável pela fazenda poderá suspender ou bloquear o acesso de qualquer usuário que descumpra estes Termos, utilize a plataforma de forma inadequada ou represente risco à segurança dos dados. O bloqueio não exclui os registros necessários à operação, auditoria ou cumprimento de obrigações legais.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-2">5. Isenção de responsabilidade</h2>
            <p>
              O Agro-BI é uma ferramenta de apoio à gestão e organização de informações. As decisões de campo, incluindo recomendações, aplicações, uso de insumos e demais operações agrícolas baseadas nos dados registrados, são de responsabilidade exclusiva do gestor e dos profissionais habilitados da fazenda.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-2">6. Alterações e contato</h2>
            <p>
              Estes Termos poderão ser atualizados para refletir mudanças no sistema ou na legislação aplicável. A versão vigente estará disponível nesta página. Dúvidas ou solicitações devem ser encaminhadas ao responsável pela administração da fazenda.
            </p>
          </section>
        </div>

        <div className="flex flex-wrap gap-4 mt-8">
          <Link to="/privacidade" className="text-emerald-700 hover:text-emerald-800 font-semibold underline underline-offset-4">
            Política de Privacidade
          </Link>
          <Link to="/" className="text-emerald-700 hover:text-emerald-800 font-semibold underline underline-offset-4">
            Voltar ao Agro-BI
          </Link>
        </div>
      </section>
    </main>
  );
}