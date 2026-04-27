'use client';

import React from 'react';
import Link from 'next/link';
import { CheckCircle2, ArrowRight, Play, Sparkles, Activity, MessageSquare, Zap, Sun } from 'lucide-react';
import styles from './landing.module.css';
import Logo from '@/components/Logo/Logo';

import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const router = useRouter();

  const handlePlanSelection = (planSlug: string) => {
    router.push(`/register?plan=${planSlug}`);
  };

  return (
    <div className={styles.container}>
      {/* Navbar */}
      <nav className={styles.navbar}>
        <div className={styles.inner}>
          <div className={styles.logo}>
            <Link href="/" className="flex items-center">
              <Logo />
            </Link>
          </div>
          
          <div className={styles.navLinks}>
            <a href="#solucao">SOLUÇÃO</a>
            <a href="#precos">PLANOS</a>
            <a href="#resultados">RESULTADOS</a>
            <a href="#faq">FAQ</a>
          </div>

          <Link href="/login" className={styles.navBtn}>
            ACESSAR O SISTEMA
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header className={styles.hero}>
        <div className={styles.inner}>
          <div className={styles.heroContent}>
            <div className={styles.badge}>
              <Sparkles size={14} className="text-yellow-400" />
              <span>INTELIGÊNCIA ARTIFICIAL PARA CLÍNICA MÉDICA</span>
            </div>
            <h1>A Inteligência Artificial que recupera pacientes para sua <span>clínica médica</span>.</h1>
            <p>O Cortex Call identifica automaticamente pacientes ausentes e inicia campanhas inteligentes de retorno via WhatsApp, otimizando a agenda e o faturamento do seu consultório.</p>
            
            {/* Moved to Hero Image overlay */}
            
            <ul className={styles.featureList}>
              <li><CheckCircle2 size={18} /> Identificação de risco com IA</li>
              <li><CheckCircle2 size={18} /> Campanhas Cortex Call via WhatsApp</li>
              <li><CheckCircle2 size={18} /> Gestão centralizada de retornos</li>
            </ul>

            <div className={styles.heroActions}>
              <Link href="/login" className={styles.primaryBtn}>
                COMEÇAR AGORA
              </Link>
              <button className={styles.secondaryBtn}>
                VER DEMONSTRAÇÃO
              </button>
            </div>
          </div>
          
          <div className={styles.heroImage}>
            <div className={styles.floatingQuote}>
              <p>
                "Sua agenda tem buracos? Pacientes desaparecem sem explicação? 
                <span>Recupere seu faturamento oculto</span> e transforme clínicas vazias em operações 24/7."
              </p>
            </div>
            
            <div className="relative group" style={{ transform: 'translateY(0px)' }}>
              <div className="relative w-full h-[450px] rounded-[32px] overflow-hidden border border-white/10 shadow-2xl">
                <img 
                  src="/medical-hero.png" 
                  alt="Cortex Call - Equipe Médica" 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#006266]/40 to-transparent"></div>
              </div>
              
              {/* Card Existente: +28% */}
              <div style={{ 
                position: 'absolute', 
                left: '-40px', 
                bottom: '80px', 
                backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                backdropFilter: 'blur(8px)', 
                padding: '16px', 
                borderRadius: '16px', 
                boxShadow: '0 10px 25px rgba(0,0,0,0.2)', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px',
                zIndex: 20,
                border: '1px solid #485460'
              }}>
                <div style={{ backgroundColor: 'rgba(249, 115, 22, 0.1)', padding: '8px', borderRadius: '12px' }}>
                  <Activity style={{ color: '#ea580c', width: '24px', height: '24px' }} />
                </div>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b' }}>+28%</div>
                  <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Recuperação</div>
                </div>
              </div>

              {/* Novo Card 1: Faturamento (Superior) */}
              <div style={{ 
                position: 'absolute', 
                right: '-32px', 
                top: '40px', 
                backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                backdropFilter: 'blur(8px)', 
                padding: '16px', 
                borderRadius: '16px', 
                boxShadow: '0 10px 25px rgba(0,0,0,0.2)', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px',
                zIndex: 20,
                border: '1px solid #485460'
              }}>
                <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '8px', borderRadius: '12px' }}>
                  <Zap style={{ color: '#059669', width: '24px', height: '24px' }} />
                </div>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b' }}>+15%</div>
                  <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Faturamento</div>
                </div>
              </div>

              {/* Novo Card 2: Automação (Inferior Direito) */}
              <div style={{ 
                position: 'absolute', 
                right: '-16px', 
                bottom: '-24px', 
                backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                backdropFilter: 'blur(8px)', 
                padding: '16px', 
                borderRadius: '16px', 
                boxShadow: '0 10px 25px rgba(0,0,0,0.2)', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px',
                zIndex: 20,
                border: '1px solid #485460'
              }}>
                <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', padding: '8px', borderRadius: '12px' }}>
                  <MessageSquare style={{ color: '#2563eb', width: '24px', height: '24px' }} />
                </div>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b' }}>24/7</div>
                  <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Automação</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Section 2: Showcase */}
      <section className={styles.showcase} id="solucao">
        <div className={styles.inner}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionBadge}>DEMONSTRAÇÃO</div>
            <h2>Gestão inteligente com Cortex Call.</h2>
            <p>Tudo o que sua clínica médica precisa para automatizar o relacionamento com o padrão Cortex Call.</p>
          </div>

          <div className={styles.showcaseGrid}>
            <div className={styles.showcaseCard}>
              <img src="/showcase-1.png" alt="Painel Cortex Call" />
              <div className={styles.cardInfo}>
                <h3>Painel de Recuperação</h3>
                <p>Visualize todos os pacientes prioritários com o score de risco exclusivo Cortex Call.</p>
              </div>
            </div>
            
            <div className={styles.showcaseCard}>
              <img src="/showcase-1.png" alt="Campanhas Inteligentes" />
              <div className={styles.cardInfo}>
                <h3>Campanhas Automáticas</h3>
                <p>Execute campanhas sugeridas pela IA com disparos diretos via WhatsApp em poucos cliques.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Pricing */}
      <section className={styles.pricing} id="precos">
        <div className={styles.inner}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionBadge}>PREÇOS</div>
            <h2>Escolha o plano ideal para sua clínica.</h2>
          </div>

          <div className={styles.pricingGrid}>
            {[
              { name: '2 ESPECIALISTAS', slug: 'plan-2-especialistas', price: '147', features: ['Até 2 Especialistas', 'Cortex Call IA', 'Otimização de Agenda', 'Suporte WhatsApp'], color: 'blue' },
              { name: '3 A 5 ESPECIALISTAS', slug: 'plan-3-5-especialistas', price: '257', features: ['Até 5 Especialistas', 'Cortex Call Pro', 'WhatsApp Cortex Ilimitado', 'Suporte Prioritário'], hot: true, color: 'teal' },
              { name: '5 A 8 ESPECIALISTAS', slug: 'plan-5-8-especialistas', price: '367', features: ['Até 8 Especialistas', 'Cortex Call Elite', 'Gestor de Contas', 'Integração Customizada'], color: 'charcoal' }
            ].map((plan, i) => (
              <div key={i} className={`${styles.pricingCard} ${plan.hot ? styles.hotPlan : ''}`}>
                {plan.hot && <span className={styles.hotBadge}>MAIS POPULAR</span>}
                <h3>{plan.name}</h3>
                <div className={styles.price}>
                  <span>R$</span> <strong>{plan.price}</strong> <small>/mês</small>
                </div>
                <ul className={styles.planFeatures}>
                  {plan.features.map((f, j) => <li key={j}><CheckCircle2 size={16} /> {f}</li>)}
                </ul>
                <Link 
                  href={`/register?plan=${plan.slug}`}
                  className={styles.planBtn}
                  style={{ display: 'block', textDecoration: 'none' }}
                >
                  ASSINAR PLANO
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 4: Testimonials */}
      <section className={styles.testimonials} id="resultados">
        <div className={styles.inner}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionBadge}>DEPOIMENTOS</div>
            <h2>O que dizem os donos de clínicas.</h2>
          </div>
          <div className={styles.testimonialsGrid}>
            {[
              { name: 'Dr. Roberto Silva', role: 'Clínica Sorriso Real', text: 'O Cortex Call recuperou mais de 40 pacientes no primeiro mês. O ROI foi imediato.' },
              { name: 'Dra. Ana Paula', role: 'Odonto Clean', text: 'O processo de automação via WhatsApp do Cortex Call é impecável. Economizamos horas.' },
              { name: 'Dr. Carlos Lima', role: 'Médico Diretor', text: 'A interface do Cortex Call é muito intuitiva. Médicos e secretárias adoream a facilidade do Cortex Call.' }
            ].map((t, i) => (
              <div key={i} className={styles.testimonialCard}>
                <div className={styles.testimonialStars}>★★★★★</div>
                <p>"{t.text}"</p>
                <div className={styles.testimonialAuthor}>
                  <strong>{t.name}</strong>
                  <span>{t.role}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 5: FAQ */}
      <section className={styles.faq} id="faq">
        <div className={styles.inner}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionBadge}>FAQ</div>
            <h2>Dúvidas frequentes.</h2>
          </div>
          <div className={styles.faqGrid}>
            {[
              { name: 'Como o Cortex Call identifica os pacientes?', a: 'O Cortex Call analisa o histórico de consultas para identificar quem não retornou para a revisão.' },
              { name: 'Preciso de um número de WhatsApp novo?', a: 'Não, você pode conectar o número oficial do seu consultório diretamente no Cortex Call.' },
              { name: 'É difícil de configurar?', a: 'Em menos de 10 minutos o Cortex Call já está pronto para recuperar seus pacientes.' }
            ].map((item, i) => (
              <div key={i} className={styles.faqItem}>
                <h4>{item.name}</h4>
                <p>{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.inner}>
          <div className={styles.footerGrid}>
            <div className={styles.footerBrand}>
              <div className="flex items-center gap-3 mb-6">
                <Logo />
              </div>
              <p>Acelerando o crescimento de clínicas médicas através da inteligência artificial.</p>
            </div>
            <div className={styles.footerLinks}>
              <h4>PRODUTO</h4>
              <a href="#">Funcionalidades</a>
              <a href="#">Planos</a>
              <a href="#">Relatórios</a>
            </div>
            <div className={styles.footerLinks}>
              <h4>LEGAL</h4>
              <a href="/dashboard/privacy">Privacidade</a>
              <a href="#">Termos de Uso</a>
            </div>
          </div>
          <div className={styles.footerBottom}>
            <p>© 2026 Cortex Call. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
