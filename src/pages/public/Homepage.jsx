import React from 'react';
import { Link } from 'react-router-dom';
import PublicShell from '../../components/public/PublicShell';
import { DEFAULT_HILUX_IMAGE_PRIMARY } from '../../services/vehicleImages';

export default function Homepage() {
  const scrollTo = (e, id) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <PublicShell>
      <main id="main-content" className="w-full">
        {/* 1. HERO SECTION */}
        <section
          id="home"
          className="relative w-full overflow-hidden pt-12 lg:pt-16 pb-12 lg:pb-16 bg-surface dark:bg-[#071A2B] transition-colors duration-300"
        >
          <div className="max-w-7xl mx-auto px-6 lg:px-margin">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center w-full">
              {/* Left Column */}
              <div className="lg:col-span-6 flex flex-col justify-center pr-0 lg:pr-4 z-10">
                <div className="inline-flex items-center gap-2 mb-4">
                  <span className="w-2.5 h-2.5 rounded-full bg-secondary-container"></span>
                  <span className="font-label-caps text-xs tracking-[0.16em] uppercase text-on-surface dark:text-white font-bold">
                    WIN BIG. DRIVE AWAY.
                  </span>
                </div>
                <h1 className="font-display-hero text-3xl sm:text-4xl lg:text-[48px] xl:text-[54px] text-on-surface dark:text-white font-bold tracking-tight mb-4 lg:mb-5 leading-[1.12]">
                  Your Next Drive Could Be Extraordinary.
                </h1>
                <p className="font-body-lg text-base sm:text-lg text-on-surface-variant dark:text-[#AAB7C4] max-w-xl mb-7 lg:mb-8 leading-relaxed">
                  Discover cash and vehicle prizes through WinDriveSA, then manage your reward journey from one secure account.
                </p>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 mb-7">
                  <Link
                    id="hero-create-account-btn"
                    to="/register"
                    className="px-7 py-3.5 bg-primary-container dark:bg-white text-on-primary dark:text-[#071A2B] font-headline-sm text-sm font-semibold rounded-lg shadow-md hover:bg-inverse-surface dark:hover:bg-slate-100 transition-all flex items-center justify-center gap-2 text-center"
                  >
                    <span>Create an Account</span>
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </Link>
                  <a
                    id="hero-explore-prizes-btn"
                    href="#prizes"
                    onClick={(e) => scrollTo(e, 'prizes')}
                    className="px-7 py-3.5 bg-surface-container-lowest dark:bg-[#0D2438] text-on-surface dark:text-white border border-surface-container-highest/80 dark:border-white/10 font-headline-sm text-sm font-semibold rounded-lg shadow-sm hover:bg-surface-container dark:hover:bg-[#132E47] transition-all flex items-center justify-center gap-2 text-center"
                  >
                    <span>Explore Prizes</span>
                    <span className="material-symbols-outlined text-[18px]">arrow_downward</span>
                  </a>
                </div>
                <div className="pt-5 border-t border-surface-container-highest dark:border-white/10 flex items-center gap-2.5">
                  <span
                    className="material-symbols-outlined text-[#00843D] text-[20px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    verified
                  </span>
                  <span className="font-body-sm text-xs sm:text-sm text-on-surface-variant dark:text-[#AAB7C4] font-medium">
                    Clear process. Personal account. Dedicated support.
                  </span>
                </div>
              </div>

              {/* Right Column: Signature automotive bleed */}
              <div className="lg:col-span-6 relative w-full h-[380px] sm:h-[460px] lg:h-[540px]">
                <div className="w-full h-full rounded-2xl overflow-hidden shadow-2xl relative border border-black/5 dark:border-white/10">
                  <img
                    id="hero-truck-image"
                    alt="2026 luxury dark metallic graphite modern double-cab 4x4 pickup truck on open paved South African mountain road"
                    className="w-full h-full object-cover object-center transform hover:scale-105 transition-transform duration-700 ease-out"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDiVFWypTaOMbd8ik-UdhqOAGzZCbseeZIVjNfloLYPuvN3DkRbp4Pwimsbl-1vORLOYy4aVYKu-jSVVO3LZlzKpx7HS6IViQMZWju69L3zykr-RV6PyOYPwzfneLMSCAztjLbl234lMsujJhDdeW4WSwdtigVtKF-8eTaQOmMg0r0FlpcALvPEl6UmKoNea8Isr56es0kodEEGwlFL67zCMk12EBehir3Ubho4vujZlv4XfIZPUhSIOA"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary-container/85 via-primary-container/20 to-transparent pointer-events-none"></div>
                  {/* Verified Specification Badge */}
                  <div className="absolute bottom-5 left-5 right-5 sm:right-auto bg-[#071A2B]/90 dark:bg-[#0D2438]/95 backdrop-blur-md px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 border border-white/10">
                    <span className="w-2.5 h-2.5 rounded-full bg-secondary-container shrink-0 animate-pulse"></span>
                    <div className="flex flex-col">
                      <span className="font-label-caps text-[10px] tracking-widest text-secondary-container uppercase font-bold">
                        Verified Allocation
                      </span>
                      <span className="font-body-sm text-xs text-white font-semibold">
                        2026 Fleet Specification · Western Cape Route
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. FEATURED PRIZES SECTION */}
        <section
          id="prizes"
          className="w-full py-16 lg:py-24 bg-surface-container-low dark:bg-[#0D2438] transition-colors duration-300"
        >
          <div className="max-w-7xl mx-auto px-6 lg:px-margin">
            <div className="flex flex-col mb-12 max-w-2xl">
              <span className="font-label-caps text-xs uppercase tracking-[0.14em] text-secondary dark:text-secondary-container font-bold mb-2.5">
                FEATURED PRIZES
              </span>
              <h2 className="font-headline-xl text-2xl sm:text-3xl lg:text-4xl text-on-surface dark:text-white font-bold tracking-tight mb-3">
                Big Rewards. Real Possibilities.
              </h2>
              <p className="font-body-lg text-base sm:text-lg text-on-surface-variant dark:text-[#AAB7C4]">
                Explore the types of rewards available through WinDriveSA, from substantial cash prizes to premium vehicles.
              </p>
            </div>

            {/* Asymmetric 2-Part Editorial Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              {/* Part A: Cash Reward Block */}
              <div
                id="cash-prize-feature-card"
                className="lg:col-span-5 bg-primary-container dark:bg-[#071A2B] text-on-primary rounded-2xl p-8 lg:p-10 flex flex-col justify-between relative shadow-xl overflow-hidden border border-white/10"
              >
                <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-secondary-container/10 rounded-full blur-3xl pointer-events-none"></div>
                <div>
                  <div className="flex items-center justify-between gap-2 mb-8">
                    <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full border border-white/10">
                      <span className="material-symbols-outlined text-secondary-container text-[16px]">
                        payments
                      </span>
                      <span className="font-label-caps text-[11px] uppercase tracking-wider text-secondary-container font-bold">
                        CASH PRIZE
                      </span>
                    </div>
                    <span className="font-body-sm text-xs text-inverse-primary">Example reward</span>
                  </div>
                  <span className="font-body-sm text-xs uppercase tracking-wider font-semibold text-inverse-primary block mb-2">
                    Guaranteed Disbursement
                  </span>
                  <div className="font-display-hero text-4xl sm:text-5xl lg:text-[50px] leading-tight font-bold text-secondary-container tracking-tight mb-5">
                    R250,000
                  </div>
                  <p className="font-body-md text-sm sm:text-base text-inverse-primary leading-relaxed mb-6">
                    Cash reward disbursed directly to verified South African bank accounts upon claim approval. Streamlined institutional verification through accredited reserve settlement protocols.
                  </p>
                </div>
                <div className="pt-6 border-t border-white/10 flex items-center justify-between">
                  <a
                    id="cash-learn-more-link"
                    className="inline-flex items-center gap-2 font-headline-sm text-sm font-bold text-secondary-container hover:underline"
                    href="#how-it-works"
                    onClick={(e) => scrollTo(e, 'how-it-works')}
                  >
                    <span>Learn More</span>
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </a>
                  <span className="font-label-caps text-[11px] tracking-widest text-[#AAB7C4] uppercase">
                    EFT Allocation
                  </span>
                </div>
              </div>

              {/* Part B: Vehicle Reward Block */}
              <div
                id="vehicle-prize-feature-card"
                className="lg:col-span-7 bg-surface-container-lowest dark:bg-[#132E47] rounded-2xl p-8 lg:p-10 shadow-lg flex flex-col justify-between relative overflow-hidden border border-surface-container-highest/60 dark:border-white/10"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-6">
                    <div className="inline-flex items-center gap-2 bg-surface-container dark:bg-[#071A2B] px-3 py-1 rounded-full border border-surface-container-highest dark:border-white/10">
                      <span className="material-symbols-outlined text-on-surface dark:text-white text-[16px]">
                        directions_car
                      </span>
                      <span className="font-label-caps text-[11px] uppercase tracking-wider text-on-surface dark:text-white font-bold">
                        VEHICLE PRIZE
                      </span>
                    </div>
                    <span className="font-body-sm text-xs text-on-surface-variant dark:text-[#AAB7C4]">
                      Example reward
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center mb-8">
                    <div>
                      <h3 className="font-headline-xl text-2xl lg:text-3xl text-on-surface dark:text-white font-bold mb-3 tracking-tight">
                        2026 Toyota Hilux
                      </h3>
                      <p className="font-body-md text-sm sm:text-base text-on-surface-variant dark:text-[#AAB7C4] mb-6 leading-relaxed">
                        A premium vehicle reward for an approved account. Engineered for durability, luxury double-cab styling, and road readiness across any South African terrain.
                      </p>
                      <div className="flex flex-col gap-2.5">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[#00843D] text-[18px]">
                            check_circle
                          </span>
                          <span className="font-body-sm text-xs sm:text-sm text-on-surface dark:text-white font-medium">
                            Comprehensive warranty &amp; service plan included
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[#00843D] text-[18px]">
                            check_circle
                          </span>
                          <span className="font-body-sm text-xs sm:text-sm text-on-surface dark:text-white font-medium">
                            Immediate on-the-road documentation &amp; licensing
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="relative w-full h-52 sm:h-64 rounded-xl overflow-hidden bg-surface-container dark:bg-[#071A2B] shadow-md border border-surface-container-highest dark:border-white/10">
                      <img
                        id="hilux-feature-img"
                        alt="Editorial close-up of 2026 Toyota Hilux double-cab"
                        className="w-full h-full object-cover"
                        src={DEFAULT_HILUX_IMAGE_PRIMARY}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  </div>
                </div>
                <div className="pt-6 border-t border-surface-container-highest dark:border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <a
                    id="vehicle-explore-link"
                    className="px-6 py-3 bg-primary-container dark:bg-white text-on-primary dark:text-[#071A2B] font-headline-sm text-sm font-semibold rounded-lg hover:bg-inverse-surface dark:hover:bg-slate-100 transition-all inline-flex items-center gap-2"
                    href="#how-it-works"
                    onClick={(e) => scrollTo(e, 'how-it-works')}
                  >
                    <span>Explore Vehicle</span>
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </a>
                  <span className="font-body-sm text-xs text-on-surface-variant dark:text-[#AAB7C4]">
                    Allocated upon verification stage approval
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. HOW IT WORKS SECTION */}
        <section
          id="how-it-works"
          className="w-full py-16 lg:py-24 bg-surface dark:bg-[#071A2B] transition-colors duration-300"
        >
          <div className="max-w-7xl mx-auto px-6 lg:px-margin">
            <div className="flex flex-col mb-14 max-w-2xl">
              <span className="font-label-caps text-xs uppercase tracking-[0.14em] text-secondary dark:text-secondary-container font-bold mb-2.5">
                HOW IT WORKS
              </span>
              <h2 className="font-headline-xl text-2xl sm:text-3xl lg:text-4xl text-on-surface dark:text-white font-bold tracking-tight mb-3">
                A Clearer Way to Claim Your Reward
              </h2>
              <p className="font-body-lg text-base sm:text-lg text-on-surface-variant dark:text-[#AAB7C4]">
                Create your account, complete the review process, view your assigned rewards, and submit your claim when it becomes available.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Step 01 */}
              <div
                id="step-card-01"
                className="bg-surface-container-lowest dark:bg-[#0D2438] p-7 rounded-2xl shadow-md flex flex-col justify-between border border-surface-container-highest/60 dark:border-white/10 hover:shadow-lg transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <span className="font-display-hero text-3xl font-bold text-secondary-container leading-none">
                      01
                    </span>
                    <span className="material-symbols-outlined text-on-surface-variant dark:text-[#AAB7C4] text-[24px]">
                      app_registration
                    </span>
                  </div>
                  <h3 className="font-headline-sm text-lg text-on-surface dark:text-white font-bold mb-2">
                    Create Your Account
                  </h3>
                  <p className="font-body-md text-sm text-on-surface-variant dark:text-[#AAB7C4] leading-relaxed">
                    Create your WinDriveSA account and provide the required information to activate your member dashboard.
                  </p>
                </div>
                <div className="mt-8 pt-4 border-t border-surface-container dark:border-white/10">
                  <span className="font-label-caps text-[11px] uppercase tracking-wider text-on-surface-variant dark:text-[#AAB7C4]">
                    Stage 1 · Initial Intake
                  </span>
                </div>
              </div>

              {/* Step 02 */}
              <div
                id="step-card-02"
                className="bg-surface-container-lowest dark:bg-[#0D2438] p-7 rounded-2xl shadow-md flex flex-col justify-between border border-surface-container-highest/60 dark:border-white/10 hover:shadow-lg transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <span className="font-display-hero text-3xl font-bold text-secondary-container leading-none">
                      02
                    </span>
                    <span className="material-symbols-outlined text-on-surface-variant dark:text-[#AAB7C4] text-[24px]">
                      verified_user
                    </span>
                  </div>
                  <h3 className="font-headline-sm text-lg text-on-surface dark:text-white font-bold mb-2">
                    Account Review
                  </h3>
                  <p className="font-body-md text-sm text-on-surface-variant dark:text-[#AAB7C4] leading-relaxed">
                    Your account is reviewed before reward information becomes available to ensure system compliance and integrity.
                  </p>
                </div>
                <div className="mt-8 pt-4 border-t border-surface-container dark:border-white/10">
                  <span className="font-label-caps text-[11px] uppercase tracking-wider text-on-surface-variant dark:text-[#AAB7C4]">
                    Stage 2 · Governance
                  </span>
                </div>
              </div>

              {/* Step 03 */}
              <div
                id="step-card-03"
                className="bg-surface-container-lowest dark:bg-[#0D2438] p-7 rounded-2xl shadow-md flex flex-col justify-between border border-surface-container-highest/60 dark:border-white/10 hover:shadow-lg transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <span className="font-display-hero text-3xl font-bold text-secondary-container leading-none">
                      03
                    </span>
                    <span className="material-symbols-outlined text-on-surface-variant dark:text-[#AAB7C4] text-[24px]">
                      visibility
                    </span>
                  </div>
                  <h3 className="font-headline-sm text-lg text-on-surface dark:text-white font-bold mb-2">
                    View Your Rewards
                  </h3>
                  <p className="font-body-md text-sm text-on-surface-variant dark:text-[#AAB7C4] leading-relaxed">
                    Once approved and assigned a reward, your available cash and vehicle rewards appear in your personal dashboard.
                  </p>
                </div>
                <div className="mt-8 pt-4 border-t border-surface-container dark:border-white/10">
                  <span className="font-label-caps text-[11px] uppercase tracking-wider text-on-surface-variant dark:text-[#AAB7C4]">
                    Stage 3 · Allocation
                  </span>
                </div>
              </div>

              {/* Step 04 */}
              <div
                id="step-card-04"
                className="bg-surface-container-lowest dark:bg-[#0D2438] p-7 rounded-2xl shadow-md flex flex-col justify-between border border-surface-container-highest/60 dark:border-white/10 hover:shadow-lg transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <span className="font-display-hero text-3xl font-bold text-secondary-container leading-none">
                      04
                    </span>
                    <span className="material-symbols-outlined text-on-surface-variant dark:text-[#AAB7C4] text-[24px]">
                      task_alt
                    </span>
                  </div>
                  <h3 className="font-headline-sm text-lg text-on-surface dark:text-white font-bold mb-2">
                    Submit Your Claim
                  </h3>
                  <p className="font-body-md text-sm text-on-surface-variant dark:text-[#AAB7C4] leading-relaxed">
                    Choose the reward you want to claim, provide the required information, and track the claim from your dashboard.
                  </p>
                </div>
                <div className="mt-8 pt-4 border-t border-surface-container dark:border-white/10">
                  <span className="font-label-caps text-[11px] uppercase tracking-wider text-on-surface-variant dark:text-[#AAB7C4]">
                    Stage 4 · Final Claim
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. ACCOUNT REVIEW & GOVERNANCE PILLARS */}
        <section className="w-full py-16 bg-surface-container-low dark:bg-[#0D2438] transition-colors duration-300">
          <div className="max-w-7xl mx-auto px-6 lg:px-margin">
            <div className="bg-surface-container-lowest dark:bg-[#132E47] rounded-3xl p-8 lg:p-12 shadow-lg border border-surface-container-highest/60 dark:border-white/10">
              <div className="max-w-3xl mb-10">
                <span className="font-label-caps text-xs uppercase tracking-[0.14em] text-secondary dark:text-secondary-container font-bold mb-2.5 block">
                  GOVERNANCE &amp; TRUST
                </span>
                <h2 className="font-headline-xl text-2xl sm:text-3xl lg:text-4xl text-on-surface dark:text-white font-bold tracking-tight mb-3">
                  Everything Starts With Your Account
                </h2>
                <p className="font-body-lg text-base sm:text-lg text-on-surface-variant dark:text-[#AAB7C4] leading-relaxed">
                  WinDriveSA keeps the reward journey organized around your personal account. Before reward information is displayed, new accounts go through a review process. Once approved, your assigned rewards and available claim actions are presented in your dashboard.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-6 border-t border-surface-container-highest dark:border-white/10">
                <div className="flex flex-col">
                  <div className="w-12 h-12 rounded-xl bg-surface-container dark:bg-[#071A2B] flex items-center justify-center mb-4 border border-surface-container-highest/60 dark:border-white/10">
                    <span className="material-symbols-outlined text-primary-container dark:text-secondary-container text-[24px]">
                      fingerprint
                    </span>
                  </div>
                  <h3 className="font-headline-sm text-lg text-on-surface dark:text-white font-bold mb-2">
                    Account-first
                  </h3>
                  <p className="font-body-md text-sm text-on-surface-variant dark:text-[#AAB7C4] leading-relaxed">
                    Your reward information is connected strictly to your authenticated personal account, safeguarding allocation privacy.
                  </p>
                </div>
                <div className="flex flex-col">
                  <div className="w-12 h-12 rounded-xl bg-surface-container dark:bg-[#071A2B] flex items-center justify-center mb-4 border border-surface-container-highest/60 dark:border-white/10">
                    <span className="material-symbols-outlined text-primary-container dark:text-secondary-container text-[24px]">
                      timeline
                    </span>
                  </div>
                  <h3 className="font-headline-sm text-lg text-on-surface dark:text-white font-bold mb-2">
                    Clear status
                  </h3>
                  <p className="font-body-md text-sm text-on-surface-variant dark:text-[#AAB7C4] leading-relaxed">
                    Track where your claim stands in real time as it moves through the systematic review and delivery process.
                  </p>
                </div>
                <div className="flex flex-col">
                  <div className="w-12 h-12 rounded-xl bg-surface-container dark:bg-[#071A2B] flex items-center justify-center mb-4 border border-surface-container-highest/60 dark:border-white/10">
                    <span className="material-symbols-outlined text-primary-container dark:text-secondary-container text-[24px]">
                      headset_mic
                    </span>
                  </div>
                  <h3 className="font-headline-sm text-lg text-on-surface dark:text-white font-bold mb-2">
                    Direct support
                  </h3>
                  <p className="font-body-md text-sm text-on-surface-variant dark:text-[#AAB7C4] leading-relaxed">
                    Contact our dedicated WinDriveSA support team directly through phone, ticket, or WhatsApp when you need assistance.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5. FULL-BLEED AUTOMOTIVE BANNER */}
        <section className="w-full relative py-28 lg:py-36 overflow-hidden bg-primary-container">
          <div className="absolute inset-0 z-0">
            <img
              id="cinematic-landscape-img"
              alt="Cinematic automotive landscape"
              className="w-full h-full object-cover opacity-35"
              src="https://lh3.googleusercontent.com/aida/AEtjO1VMeeFBTOE4wmcy_scgHN4g_N7crdwvVD6JUlRe5vMGNdobh9cB4U8PVaxbBEutPhQguPCA2B0cj8cg960dkB5CrJqzqUtTdbaEUXgukio3ckZqdBLj74x3aNyKWFj67mb5RIepA3GkJiE7LznQK-o0XbdR4rBg4A06_c16V-lFhmZMlT2jzAkSEYjqP4MMsjhkYuxwYEZwMpM7lMffOF8xI5uPCMnvT271cz8iQjF5ZEXMhuj0elZ7dJA"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-primary-container via-primary-container/85 to-primary-container/40 pointer-events-none"></div>
          </div>
          <div className="max-w-7xl mx-auto px-6 lg:px-margin relative z-10">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 mb-4">
                <span className="w-2.5 h-2.5 rounded-full bg-secondary-container"></span>
                <span className="font-label-caps text-xs uppercase tracking-[0.14em] text-secondary-container font-bold">
                  THE DRIVE AWAITS
                </span>
              </div>
              <h2 className="font-headline-xl text-3xl sm:text-4xl lg:text-5xl text-white font-bold tracking-tight mb-5 leading-tight">
                Some Rewards Change What Comes Next.
              </h2>
              <p className="font-body-lg text-base sm:text-lg text-inverse-primary mb-8 max-w-xl leading-relaxed">
                From cash rewards to vehicles built for the road ahead, WinDriveSA brings your reward journey into one place.
              </p>
              <a
                id="banner-explore-prizes-btn"
                className="px-8 py-4 bg-secondary-container text-[#071A2B] font-headline-sm text-sm font-bold rounded-lg shadow-lg hover:bg-yellow-400 transition-all inline-flex items-center gap-2"
                href="#prizes"
                onClick={(e) => scrollTo(e, 'prizes')}
              >
                <span>Explore Prizes</span>
                <span className="material-symbols-outlined text-[18px]">arrow_downward</span>
              </a>
            </div>
          </div>
        </section>

        {/* 6. ABOUT WINDRIVESA */}
        <section
          id="about"
          className="w-full py-16 lg:py-24 bg-surface-container-low dark:bg-[#0D2438] transition-colors duration-300"
        >
          <div className="max-w-7xl mx-auto px-6 lg:px-margin">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-6">
                <span className="font-label-caps text-xs uppercase tracking-[0.14em] text-secondary dark:text-secondary-container font-bold mb-2.5 block">
                  ABOUT WINDRIVESA
                </span>
                <h2 className="font-headline-xl text-2xl sm:text-3xl lg:text-4xl text-on-surface dark:text-white font-bold tracking-tight mb-5">
                  Built Around the Moment That Matters.
                </h2>
                <div className="flex flex-col gap-4 text-on-surface-variant dark:text-[#AAB7C4] font-body-lg text-base sm:text-lg leading-relaxed">
                  <p>
                    WinDriveSA is designed to give people a clear place to manage their reward journey — from account creation and review to viewing assigned prizes and submitting claims.
                  </p>
                  <p>
                    Our focus is simple: make every step easier to understand, keep reward information connected to your account, and give you a direct way to reach support when you need it.
                  </p>
                </div>
              </div>
              <div className="lg:col-span-6 grid grid-cols-2 gap-4">
                <div className="bg-surface-container-lowest dark:bg-[#132E47] p-6 rounded-2xl shadow-sm border border-surface-container-highest/60 dark:border-white/10">
                  <span className="font-headline-xl text-3xl font-bold text-on-surface dark:text-white block mb-1">
                    100%
                  </span>
                  <span className="font-headline-sm text-sm font-semibold text-on-surface dark:text-white block mb-2">
                    Transparent Workflow
                  </span>
                  <span className="font-body-sm text-xs text-on-surface-variant dark:text-[#AAB7C4]">
                    Every stage is trackable through your personal dashboard.
                  </span>
                </div>
                <div className="bg-surface-container-lowest dark:bg-[#132E47] p-6 rounded-2xl shadow-sm border border-surface-container-highest/60 dark:border-white/10">
                  <span className="font-headline-xl text-3xl font-bold text-on-surface dark:text-white block mb-1">
                    24/7
                  </span>
                  <span className="font-headline-sm text-sm font-semibold text-on-surface dark:text-white block mb-2">
                    Member Support
                  </span>
                  <span className="font-body-sm text-xs text-on-surface-variant dark:text-[#AAB7C4]">
                    Continuous access to assistance and verification teams.
                  </span>
                </div>
                <div className="bg-surface-container-lowest dark:bg-[#132E47] p-6 rounded-2xl shadow-sm col-span-2 border border-surface-container-highest/60 dark:border-white/10">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="material-symbols-outlined text-[#00843D] text-[22px]">
                      policy
                    </span>
                    <span className="font-headline-sm text-base font-bold text-on-surface dark:text-white">
                      South African Regulatory Alignment
                    </span>
                  </div>
                  <p className="font-body-sm text-xs sm:text-sm text-on-surface-variant dark:text-[#AAB7C4] leading-relaxed">
                    Built strictly around South African consumer privacy regulations (POPIA) and transparent institutional governance standards.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 7. FAQ SECTION */}
        <section
          id="faqs"
          className="w-full py-16 lg:py-24 bg-surface dark:bg-[#071A2B] transition-colors duration-300"
        >
          <div className="max-w-4xl mx-auto px-6 lg:px-margin">
            <div className="text-center mb-14">
              <span className="font-label-caps text-xs uppercase tracking-[0.14em] text-secondary dark:text-secondary-container font-bold mb-2 block">
                FAQ
              </span>
              <h2 className="font-headline-xl text-2xl sm:text-3xl lg:text-4xl text-on-surface dark:text-white font-bold tracking-tight mb-3">
                Questions, Answered.
              </h2>
              <p className="font-body-lg text-base sm:text-lg text-on-surface-variant dark:text-[#AAB7C4] max-w-xl mx-auto">
                Clear answers about the platform, rewards, and the claims process.
              </p>
            </div>
            <div className="flex flex-col gap-4">
              <details className="group bg-surface-container-lowest dark:bg-[#0D2438] rounded-2xl shadow-sm p-6 border border-surface-container-highest/60 dark:border-white/10 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex items-center justify-between cursor-pointer font-headline-sm text-base sm:text-lg text-on-surface dark:text-white font-bold select-none">
                  <span>What is WinDriveSA?</span>
                  <span className="material-symbols-outlined text-on-surface-variant dark:text-[#AAB7C4] group-open:rotate-180 transition-transform">
                    expand_more
                  </span>
                </summary>
                <div className="pt-4 text-on-surface-variant dark:text-[#AAB7C4] font-body-md text-sm sm:text-base border-t border-surface-container dark:border-white/10 mt-4 leading-relaxed">
                  WinDriveSA is a secure reward platform where participants register an account, complete account review, view assigned prizes, and submit claims for cash or vehicle rewards.
                </div>
              </details>

              <details className="group bg-surface-container-lowest dark:bg-[#0D2438] rounded-2xl shadow-sm p-6 border border-surface-container-highest/60 dark:border-white/10 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex items-center justify-between cursor-pointer font-headline-sm text-base sm:text-lg text-on-surface dark:text-white font-bold select-none">
                  <span>Do I see my rewards immediately after registering?</span>
                  <span className="material-symbols-outlined text-on-surface-variant dark:text-[#AAB7C4] group-open:rotate-180 transition-transform">
                    expand_more
                  </span>
                </summary>
                <div className="pt-4 text-on-surface-variant dark:text-[#AAB7C4] font-body-md text-sm sm:text-base border-t border-surface-container dark:border-white/10 mt-4 leading-relaxed">
                  New accounts undergo an initial review process to confirm eligibility and ensure compliance. Once your account is reviewed and assigned a reward, your available rewards will display inside your dashboard.
                </div>
              </details>

              <details className="group bg-surface-container-lowest dark:bg-[#0D2438] rounded-2xl shadow-sm p-6 border border-surface-container-highest/60 dark:border-white/10 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex items-center justify-between cursor-pointer font-headline-sm text-base sm:text-lg text-on-surface dark:text-white font-bold select-none">
                  <span>Where can I see my rewards?</span>
                  <span className="material-symbols-outlined text-on-surface-variant dark:text-[#AAB7C4] group-open:rotate-180 transition-transform">
                    expand_more
                  </span>
                </summary>
                <div className="pt-4 text-on-surface-variant dark:text-[#AAB7C4] font-body-md text-sm sm:text-base border-t border-surface-container dark:border-white/10 mt-4 leading-relaxed">
                  All assigned rewards are displayed directly within your secure WinDriveSA account dashboard after you log in.
                </div>
              </details>

              <details className="group bg-surface-container-lowest dark:bg-[#0D2438] rounded-2xl shadow-sm p-6 border border-surface-container-highest/60 dark:border-white/10 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex items-center justify-between cursor-pointer font-headline-sm text-base sm:text-lg text-on-surface dark:text-white font-bold select-none">
                  <span>Can I claim both cash and a vehicle?</span>
                  <span className="material-symbols-outlined text-on-surface-variant dark:text-[#AAB7C4] group-open:rotate-180 transition-transform">
                    expand_more
                  </span>
                </summary>
                <div className="pt-4 text-on-surface-variant dark:text-[#AAB7C4] font-body-md text-sm sm:text-base border-t border-surface-container dark:border-white/10 mt-4 leading-relaxed">
                  Reward allocations depend on your specific verified assignment. Details regarding available options are clearly indicated in your account dashboard.
                </div>
              </details>

              <details className="group bg-surface-container-lowest dark:bg-[#0D2438] rounded-2xl shadow-sm p-6 border border-surface-container-highest/60 dark:border-white/10 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex items-center justify-between cursor-pointer font-headline-sm text-base sm:text-lg text-on-surface dark:text-white font-bold select-none">
                  <span>What happens after I submit a claim?</span>
                  <span className="material-symbols-outlined text-on-surface-variant dark:text-[#AAB7C4] group-open:rotate-180 transition-transform">
                    expand_more
                  </span>
                </summary>
                <div className="pt-4 text-on-surface-variant dark:text-[#AAB7C4] font-body-md text-sm sm:text-base border-t border-surface-container dark:border-white/10 mt-4 leading-relaxed">
                  Once submitted, your claim enters the verification stage. Our support and compliance team will review the submitted details, coordinate necessary paperwork, and provide updates via your dashboard.
                </div>
              </details>

              <details className="group bg-surface-container-lowest dark:bg-[#0D2438] rounded-2xl shadow-sm p-6 border border-surface-container-highest/60 dark:border-white/10 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex items-center justify-between cursor-pointer font-headline-sm text-base sm:text-lg text-on-surface dark:text-white font-bold select-none">
                  <span>How do I get support?</span>
                  <span className="material-symbols-outlined text-on-surface-variant dark:text-[#AAB7C4] group-open:rotate-180 transition-transform">
                    expand_more
                  </span>
                </summary>
                <div className="pt-4 text-on-surface-variant dark:text-[#AAB7C4] font-body-md text-sm sm:text-base border-t border-surface-container dark:border-white/10 mt-4 leading-relaxed">
                  You can reach support via our dedicated contact page, by logging into your account to submit a ticket, or via the official WhatsApp support channel provided upon registration.
                </div>
              </details>
            </div>
          </div>
        </section>

        {/* 8. CONTACT SECTION */}
        <section
          id="contact"
          className="w-full py-16 lg:py-24 bg-primary-container text-on-primary transition-colors duration-300"
        >
          <div className="max-w-7xl mx-auto px-6 lg:px-margin">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-7">
                <span className="font-label-caps text-xs uppercase tracking-[0.14em] text-secondary-container font-bold mb-2.5 block">
                  CONTACT
                </span>
                <h2 className="font-headline-xl text-2xl sm:text-3xl lg:text-4xl text-white font-bold tracking-tight mb-4">
                  Need Help With Your Reward Journey?
                </h2>
                <p className="font-body-lg text-base sm:text-lg text-inverse-primary max-w-xl mb-8 leading-relaxed">
                  If you have a question about your account, reward, or claim, our support team is available to help.
                </p>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-5">
                  <a
                    id="contact-support-email-btn"
                    className="px-8 py-3.5 bg-secondary-container text-[#071A2B] font-headline-sm text-sm font-bold rounded-lg hover:bg-yellow-400 transition-all flex items-center justify-center gap-2 text-center shadow-md"
                    href="mailto:support@windrivesa.co.za"
                  >
                    <span className="material-symbols-outlined text-[20px]">support_agent</span>
                    <span>Contact Support</span>
                  </a>
                  <Link
                    id="contact-login-btn"
                    to="/login"
                    className="px-8 py-3.5 bg-white/10 text-white border border-white/20 font-headline-sm text-sm font-semibold rounded-lg hover:bg-white/20 transition-all flex items-center justify-center gap-2 text-center"
                  >
                    <span>Log In</span>
                    <span className="material-symbols-outlined text-[18px]">login</span>
                  </Link>
                </div>
                <p className="font-body-sm text-xs text-on-primary-container">
                  Note: WhatsApp support channel connects directly upon registration.
                </p>
              </div>

              <div className="lg:col-span-5 bg-[#132E47]/70 backdrop-blur-md rounded-2xl p-7 lg:p-8 border border-white/10">
                <h3 className="font-headline-sm text-lg text-white font-bold mb-6">
                  Direct Assistance
                </h3>
                <div className="flex flex-col gap-5">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0 border border-white/10">
                      <span className="material-symbols-outlined text-secondary-container text-[20px]">
                        mail
                      </span>
                    </div>
                    <div>
                      <span className="font-body-sm text-xs text-[#AAB7C4] block">Electronic Mail</span>
                      <span className="font-headline-sm text-sm text-white font-medium">
                        support@windrivesa.co.za
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0 border border-white/10">
                      <span className="material-symbols-outlined text-secondary-container text-[20px]">
                        schedule
                      </span>
                    </div>
                    <div>
                      <span className="font-body-sm text-xs text-[#AAB7C4] block">
                        Review Center Hours
                      </span>
                      <span className="font-headline-sm text-sm text-white font-medium">
                        Mon – Fri: 08:00 – 17:00 (SAST)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0 border border-white/10">
                      <span className="material-symbols-outlined text-[#00843D] text-[20px]">
                        verified
                      </span>
                    </div>
                    <div>
                      <span className="font-body-sm text-xs text-[#AAB7C4] block">Jurisdiction</span>
                      <span className="font-headline-sm text-sm text-white font-medium">
                        Cape Town &amp; Johannesburg Operations, RSA
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER CONTINUITY */}
      <footer id="public-footer" className="w-full bg-[#071A2B] text-[#AAB7C4] border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 lg:px-margin py-12 lg:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-space-xl">
            {/* Logo & Brand Info */}
            <div className="lg:col-span-2 flex flex-col gap-3">
              <div className="flex items-center gap-space-sm">
                <img
                  id="footer-brand-logo"
                  alt="WinDriveSA"
                  className="h-9 w-auto object-contain"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuA3DLycluwQHBBw7aVgA56NRi8NAK5rXHI9G7qHBY7zE7tAIRJHQZ5Ra1uRqqv_cHhhk4794XqUWu1uCZ3XuTVJN3TPN-TrbiIy581S_L4uJ_TtmIgbQudiEGMqY4tvBU0S0X8gA6CSzJgRTTwxlhChX8shYRnLrnfILvQ67gJou67P1yqKBUWdKylIPxW4WmsZsh3czBlBqDZXnF5Z6zZdIsfpcb9sDc7_NS784LyrjDfr1t7wlYZMOD8rIemwckk6rag"
                />
              </div>
              <p className="font-headline-sm text-base text-secondary-container font-semibold mt-1">
                Win Big. Drive Away.
              </p>
              <p className="font-body-sm text-xs text-[#AAB7C4] max-w-sm leading-relaxed">
                South Africa's premier transparent vehicle allocation and institutional prize platform. Rigorous compliance, verified audit standards, and tangible empowerment.
              </p>
            </div>

            {/* Col 1: Platform Navigation (NO public winners link) */}
            <div className="flex flex-col gap-2.5">
              <span className="font-label-caps text-xs uppercase tracking-wider text-white font-bold">
                Platform Navigation
              </span>
              <div className="flex flex-col gap-2">
                <a
                  className="font-body-sm text-xs text-[#AAB7C4] hover:text-secondary-container transition-colors"
                  href="#home"
                  onClick={(e) => scrollTo(e, 'home')}
                >
                  Home
                </a>
                <a
                  className="font-body-sm text-xs text-[#AAB7C4] hover:text-secondary-container transition-colors"
                  href="#prizes"
                  onClick={(e) => scrollTo(e, 'prizes')}
                >
                  Verified Prizes
                </a>
                <a
                  className="font-body-sm text-xs text-[#AAB7C4] hover:text-secondary-container transition-colors"
                  href="#how-it-works"
                  onClick={(e) => scrollTo(e, 'how-it-works')}
                >
                  How It Works
                </a>
                <a
                  className="font-body-sm text-xs text-[#AAB7C4] hover:text-secondary-container transition-colors"
                  href="#about"
                  onClick={(e) => scrollTo(e, 'about')}
                >
                  About Institutional Draw
                </a>
              </div>
            </div>

            {/* Col 2: Member Access */}
            <div className="flex flex-col gap-2.5">
              <span className="font-label-caps text-xs uppercase tracking-wider text-white font-bold">
                Member Access
              </span>
              <div className="flex flex-col gap-2">
                <Link
                  className="font-body-sm text-xs text-[#AAB7C4] hover:text-secondary-container transition-colors"
                  to="/login"
                >
                  Log In
                </Link>
                <Link
                  className="font-body-sm text-xs text-[#AAB7C4] hover:text-secondary-container transition-colors"
                  to="/register"
                >
                  Create Account
                </Link>
                <a
                  className="font-body-sm text-xs text-[#AAB7C4] hover:text-secondary-container transition-colors"
                  href="#faqs"
                  onClick={(e) => scrollTo(e, 'faqs')}
                >
                  Member FAQs
                </a>
                <a
                  className="font-body-sm text-xs text-[#AAB7C4] hover:text-secondary-container transition-colors"
                  href="#about"
                  onClick={(e) => scrollTo(e, 'about')}
                >
                  Draw Governance
                </a>
              </div>
            </div>

            {/* Col 3: Verification & Help */}
            <div className="flex flex-col gap-2.5">
              <span className="font-label-caps text-xs uppercase tracking-wider text-white font-bold">
                Verification &amp; Help
              </span>
              <div className="flex flex-col gap-2">
                <a
                  className="font-body-sm text-xs text-[#AAB7C4] hover:text-secondary-container transition-colors"
                  href="#contact"
                  onClick={(e) => scrollTo(e, 'contact')}
                >
                  Contact Support
                </a>
                <a
                  className="font-body-sm text-xs text-[#AAB7C4] hover:text-secondary-container transition-colors"
                  href="#about"
                  onClick={(e) => scrollTo(e, 'about')}
                >
                  Audit &amp; Compliance
                </a>
                <a
                  className="font-body-sm text-xs text-[#AAB7C4] hover:text-secondary-container transition-colors"
                  href="#about"
                  onClick={(e) => scrollTo(e, 'about')}
                >
                  POPIA &amp; Privacy Policy
                </a>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
            <p className="font-body-sm text-xs text-[#AAB7C4]">
              Official company information will be published here. © 2024–2026 WinDriveSA. All rights reserved.
            </p>
            <div className="flex items-center gap-2">
              <span className="font-label-caps text-[11px] text-[#AAB7C4] uppercase tracking-wider">
                Republic of South Africa
              </span>
            </div>
          </div>
        </div>
      </footer>
    </PublicShell>
  );
}
