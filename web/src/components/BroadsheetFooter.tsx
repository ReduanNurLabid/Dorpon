import React from 'react';
import { useApp } from '../context/AppContext';

export const BroadsheetFooter: React.FC = () => {
  const { language } = useApp();
  const isBn = language === 'bn';

  const scrollToTop = (e: React.MouseEvent) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="w-full border-t-2 border-primary bg-surface-container mt-12 mb-20 md:mb-12">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col">
        {/* Upper Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-8 border-b border-primary/20">
          {/* Brand & Description */}
          <div className="md:col-span-5">
            <span className="font-display-masthead text-2xl sm:text-3xl tracking-tight text-primary uppercase font-bold">
              {isBn ? 'সন্দেশ এক্সপ্রেস' : 'SONDESH EXPRESS'}
            </span>
            <p className="font-serif text-sm text-on-surface-variant mt-2 max-w-md leading-relaxed">
              {isBn
                ? 'প্রতিষ্ঠিত ১৯৮৪ খ্রিষ্টাব্দ। নীতিনির্ধারক, গবেষক এবং সিদ্ধান্ত গ্রহণকারীদের জন্য ৩-স্তরীয় যাচাইকৃত সারসংক্ষেপ।'
                : 'Established MDCCCCLXXXIV. Reformulated for senior decision makers, researchers, and policy fellows with verified 3-tier scannable intelligence.'}
            </p>
            <div className="mt-4 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider flex items-center gap-2">
              <span>{isBn ? 'ঢাকা ব্যুরো' : 'Dhaka Bureau'}</span>
              <span>•</span>
              <span>{isBn ? 'জেনেভা ওয়্যার' : 'Geneva Wire'}</span>
              <span>•</span>
              <span>{isBn ? 'লন্ডন ব্যুরো' : 'London Bureau'}</span>
            </div>
          </div>

          {/* Links Column 1: Editorial Directory */}
          <div className="md:col-span-4">
            <h4 className="font-serif text-base font-bold text-primary mb-3 uppercase tracking-wide">
              {isBn ? 'নির্বাহী ওয়্যার ডিরেক্টরি' : 'Executive Wire Directory'}
            </h4>
            <div className="grid grid-cols-2 gap-2 font-label-sm text-label-sm uppercase">
              <span className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer">
                {isBn ? 'মূল বিষয়' : 'Key Takeway'}
              </span>
              <span className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer">
                {isBn ? 'টেলিমেট্রি ওয়্যার' : 'Telemetry Wire'}
              </span>
              <span className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer">
                {isBn ? 'কারেন্ট অ্যাফেয়ার্স' : 'Current Affairs'}
              </span>
              <span className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer">
                {isBn ? 'অডিও ব্রিফিং' : 'Audio Briefings'}
              </span>
              <span className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer">
                {isBn ? 'যাচাইকৃত সূত্র' : 'Verified Sources'}
              </span>
              <span className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer">
                {isBn ? 'সম্পাদকীয় প্যানেল' : 'Masthead Directory'}
              </span>
            </div>
          </div>

          {/* Links Column 2: Legal & Protocol */}
          <div className="md:col-span-3">
            <h4 className="font-serif text-base font-bold text-primary mb-3 uppercase tracking-wide">
              {isBn ? 'প্রেস প্রটোকল' : 'Press Protocols'}
            </h4>
            <div className="flex flex-col space-y-2 font-label-sm text-label-sm uppercase">
              <span className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer">
                {isBn ? 'ব্যবহারের শর্তাবলী' : 'Terms of Service'}
              </span>
              <span className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer">
                {isBn ? 'গোপনীয়তা নীতিমালা' : 'Privacy Protocol'}
              </span>
              <span className="text-on-surface-variant pt-2 normal-case font-serif text-xs">
                {isBn
                  ? 'প্রেস কাউন্সিল নিবন্ধন নং ৪১৮/ডিসি-পিআর-২০২৪'
                  : 'Press Council Registration No. 418/DC-PR-2024'}
              </span>
            </div>
          </div>
        </div>

        {/* Lower Footer Copyright & Disclaimer */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-on-surface-variant font-serif text-xs sm:text-sm">
          <p>
            &copy; 2026 Sondesh Express. Established MDCCCCLXXXIV. All editorial summary rights reserved.
          </p>
          <div className="mt-3 sm:mt-0 flex items-center space-x-4 font-label-sm text-label-sm uppercase">
            <span className="text-outline-variant hidden sm:inline">
              {isBn ? '৩-স্তরীয় স্ক্যানযোগ্য ব্রডশিট বিন্যাস' : '3-Tier Scannable Ink Format'}
            </span>
            <button
              onClick={scrollToTop}
              className="text-primary hover:underline font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>{isBn ? 'শীর্ষে ফিরে যান' : 'Back to Top'}</span>
              <span>&uarr;</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
