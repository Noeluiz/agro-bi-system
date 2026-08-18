import { Sprout } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Privacidade() {
  return (
    <main className="min-h-screen bg-stone-50 py-10 px-4">
      <section className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-sm p-6 md:p-10">
        <Link to="/" className="inline-flex items-center gap-2 text-emerald-800 font-bold hover:text-emerald-700">
          <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-800">
            <Sprout className="w-5 h-5 text-emerald-100" aria-hidden="true" />
          </span>
          Agro-BI
        </Link>

        <h1 className="text-3xl font-bold text-emerald-800 mt-8">Política de Privacidade</h1>
        <p className="text-slate-500 mt-2">Última atualização: agosto de 2026</p>

        <div className="mt-8 space-y-6 text-slate-700 leading-relaxed">
          <p>
            O Agro-BI guarda as informações cadastradas no sistema com medidas de segurança adequadas para proteger os dados da fazenda e de seus usuários.
          </p>
          <p>
            Usamos esses dados somente para a gestão interna da fazenda, como controle de estoque, financeiro, funcionários, safras e relatórios. Não vendemos nem usamos essas informações para publicidade.
          </p>
          <p>
            O acesso é limitado a usuários autorizados, de acordo com o perfil de cada conta. Pedimos que cada pessoa mantenha sua senha em sigilo.
          </p>
          <p>
            Caso queira excluir seus dados ou tenha dúvidas sobre esta política, solicite a exclusão ao responsável pela administração da fazenda. A solicitação será analisada respeitando os registros que precisem ser mantidos para a operação do sistema.
          </p>
        </div>

        <Link to="/" className="inline-flex mt-8 text-emerald-700 hover:text-emerald-800 font-semibold underline underline-offset-4">
          Voltar ao Agro-BI
        </Link>
      </section>
    </main>
  );
}
