import { Language, ChatMessage } from '../types';
import { resources, SUPPORTED_LANGUAGES } from '../i18n';
import { sendChatMessage } from './api';

export interface AIAdvisorResponse {
  text: string;
  vernacularNativeSlang: string;
  phoneticColloquialSlang: string;
  dialectLabel: string;
  metadata?: ChatMessage['metadata'];
}

export const LANG_BCP47_MAP: Record<Language, string> = {
  en: 'en-IN',
  kn: 'kn-IN',
  ta: 'ta-IN',
  hi: 'hi-IN',
  te: 'te-IN',
  ml: 'ml-IN',
  mr: 'mr-IN',
  ur: 'ur-IN',
  bn: 'bn-IN',
  gu: 'gu-IN',
  pa: 'pa-IN',
  or: 'or-IN',
  as: 'as-IN',
  kok: 'kok-IN',
};

export const getWelcomeResponseForLanguage = (lang: Language): AIAdvisorResponse => {
  const tr = resources[lang]?.translation || resources.en.translation;
  const langObj = SUPPORTED_LANGUAGES.find((l) => l.code === lang);
  const label = langObj ? `${langObj.nativeName} (${langObj.name})` : 'Regional';
  return {
    text: tr.aiGreeting,
    vernacularNativeSlang: tr.aiGreeting,
    phoneticColloquialSlang: tr.aiGreeting,
    dialectLabel: label,
  };
};

export const askLiveGeminiAdvisor = async (
  query: string,
  lang: Language,
  conversationId?: number | null
): Promise<{
  conversationId: number;
  response: AIAdvisorResponse;
}> => {
  const data = await sendChatMessage({
    message: query,
    language: lang,
    conversation_id: conversationId,
  });
  const langObj = SUPPORTED_LANGUAGES.find((l) => l.code === lang);
  return {
    conversationId: data.conversation_id,
    response: {
      text: data.reply,
      vernacularNativeSlang: data.reply,
      phoneticColloquialSlang: data.reply,
      dialectLabel: langObj ? `${langObj.nativeName} (${langObj.name})` : lang.toUpperCase(),
    },
  };
};

export const getGenuineVoiceForLanguage = (lang: Language): SpeechSynthesisVoice | null => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  const targetLocale = LANG_BCP47_MAP[lang] || 'en-IN';
  const langPrefix = targetLocale.split('-')[0].toLowerCase();

  // Exact locale match (e.g. hi-IN, kn-IN, ta-IN, te-IN, en-IN)
  const exactMatch = voices.find(
    (v) => v.lang.toLowerCase().replace('_', '-') === targetLocale.toLowerCase()
  );
  if (exactMatch) return exactMatch;

  // Prefix + Google/Natural voice match
  const prefixMatch = voices.find((v) =>
    v.lang.toLowerCase().startsWith(langPrefix)
  );
  if (prefixMatch) return prefixMatch;

  return null;
};

export const stopSpeaking = (): void => {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {
      console.warn('SpeechSynthesis cancel warning:', e);
    }
  }
};

export const speakText = (
  res: AIAdvisorResponse,
  lang: Language,
  onEnd?: () => void,
  rate = 0.95
): void => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    onEnd?.();
    return;
  }

  stopSpeaking();

  const nativeVoice = getGenuineVoiceForLanguage(lang);
  const textToSpeak = nativeVoice
    ? res.vernacularNativeSlang || res.text
    : res.phoneticColloquialSlang || res.vernacularNativeSlang || res.text;

  const utterance = new SpeechSynthesisUtterance(textToSpeak);
  utterance.lang = nativeVoice ? nativeVoice.lang : LANG_BCP47_MAP[lang] || 'en-IN';
  if (nativeVoice) {
    utterance.voice = nativeVoice;
  } else {
    // Fallback to Indian English voice if available for readable phonetic slang
    const enInVoice = getGenuineVoiceForLanguage('en');
    if (enInVoice) utterance.voice = enInVoice;
  }

  utterance.rate = rate;
  utterance.pitch = 1.0;

  let finished = false;
  const safeFinish = () => {
    if (!finished) {
      finished = true;
      onEnd?.();
    }
  };

  utterance.onend = safeFinish;
  utterance.onerror = safeFinish;

  // Safety timeout in case a browser speech engine hangs silently
  const estMs = Math.min(24000, Math.max(4000, textToSpeak.length * 85));
  const fallbackTimer = setTimeout(safeFinish, estMs);

  utterance.onend = () => {
    clearTimeout(fallbackTimer);
    safeFinish();
  };
  utterance.onerror = () => {
    clearTimeout(fallbackTimer);
    safeFinish();
  };

  try {
    window.speechSynthesis.speak(utterance);
  } catch {
    clearTimeout(fallbackTimer);
    safeFinish();
  }
};

type IntentKey =
  | 'welcome'
  | 'home'
  | 'personal'
  | 'vehicle'
  | 'education'
  | 'business'
  | 'agriculture'
  | 'compare'
  | 'cibil'
  | 'gov'
  | 'freelancer'
  | 'retired'
  | 'homemaker'
  | 'general';

function detectIntent(query: string): IntentKey {
  const q = query.toLowerCase();
  if (q === 'welcome') return 'welcome';
  if (q.includes('kcc') || q.includes('kisan') || q.includes('farmer') || q.includes('agri') || q.includes('किसान') || q.includes('ಕೃಷಿ') || q.includes('விவசாய') || q.includes('రైతు')) return 'agriculture';
  if (q.includes('gov') || q.includes('psu') || q.includes('सरकारी') || q.includes('ಸರ್ಕಾರಿ') || q.includes('அரசு') || q.includes('ప్రభుత్వ')) return 'gov';
  if (q.includes('freelancer') || q.includes('gig') || q.includes('फ्रीलांस') || q.includes('ಫ್ರೀಲ್ಯಾನ್ಸರ್')) return 'freelancer';
  if (q.includes('retired') || q.includes('pension') || q.includes('पेंशन') || q.includes('ಪಿಂಚಣಿ')) return 'retired';
  if (q.includes('homemaker') || q.includes('women') || q.includes('गृहिणी') || q.includes('ಗೃಹಿಣಿ')) return 'homemaker';
  if (q.includes('compare') || q.includes('sbi') || q.includes('hdfc') || q.includes('icici') || q.includes('vs') || q.includes('तुलना') || q.includes('ಹೋಲಿಸಿ') || q.includes('ஒப்பிடு') || q.includes('పోల్చండి')) return 'compare';
  if (q.includes('home') || q.includes('house') || q.includes('flat') || q.includes('होम') || q.includes('घर') || q.includes('ಗೃಹ') || q.includes('ಮನೆ') || q.includes('வீடு') || q.includes('ఇల్లు')) return 'home';
  if (q.includes('personal') || q.includes('salary') || q.includes('पर्सनल') || q.includes('सैलरी') || q.includes('ಸಂಬಳ') || q.includes('சம்பள') || q.includes('జీత')) return 'personal';
  if (q.includes('vehicle') || q.includes('car') || q.includes('bike') || q.includes('ev') || q.includes('वाहन') || q.includes('ವಾಹನ') || q.includes('வாகன') || q.includes('వాహన')) return 'vehicle';
  if (q.includes('education') || q.includes('student') || q.includes('abroad') || q.includes('study') || q.includes('शिक्षा') || q.includes('ಶಿಕ್ಷಣ') || q.includes('கல்வி') || q.includes('విద్యా')) return 'education';
  if (q.includes('business') || q.includes('msme') || q.includes('mudra') || q.includes('gst') || q.includes('व्यापार') || q.includes('बिज़नेस') || q.includes('ವ್ಯಾಪಾರ') || q.includes('தொழில்') || q.includes('వ్యాపార')) return 'business';
  if (q.includes('cibil') || q.includes('score') || q.includes('credit')) return 'cibil';
  return 'general';
}

export const generateGeminiMockResponse = (
  query: string,
  lang: Language
): AIAdvisorResponse => {
  const intent = detectIntent(query);

  if (intent === 'welcome') {
    return getWelcomeResponseForLanguage(lang);
  }

  const responsesByLang: Partial<Record<Language, Record<IntentKey, AIAdvisorResponse>>> = {
    en: {
      welcome: {
        text: 'Namaste! Tell me your monthly income, loan purpose, or bank question in English, Hindi, Kannada, Tamil, or Telugu.',
        vernacularNativeSlang: 'Hey there! Welcome to CredVani AI. Just tell me what loan you are planning—home, car, personal, or business—and I will break down the smartest bank deal for you.',
        phoneticColloquialSlang: 'Hey there! Welcome to CredVani AI. Just tell me what loan you are planning—home, car, personal, or business—and I will break down the smartest bank deal for you.',
        dialectLabel: 'Indian Conversational English (en-IN)',
      },
      home: {
        text: 'For a ₹45 Lakh Home Loan with 750+ CIBIL:\n• Best Rate: SBI & Bank of Baroda start at 8.35%–8.40% p.a. (repo-linked) with zero prepayment penalty.\n• Fast Approval: HDFC & ICICI sanction in 48–72 hours at ~8.50%–8.65%.\n• Pro Tip: Women co-applicants get an extra 0.05% rate concession and lower stamp duty in many states.',
        vernacularNativeSlang: 'Honestly, with a solid 750 plus CIBIL score, SBI and Bank of Baroda are your best bets at around 8.35 to 8.40 percent with zero prepayment penalty. Want it super fast in two days? Go with HDFC. Also, add a woman co-applicant for extra rate perks!',
        phoneticColloquialSlang: 'Honestly, with a solid 750 plus CIBIL score, SBI and Bank of Baroda are your best bets at around 8.35 to 8.40 percent with zero prepayment penalty. Want it super fast in two days? Go with HDFC.',
        dialectLabel: 'Indian Conversational English (en-IN)',
        metadata: {
          estimatedAmount: 4500000,
          recommendedRate: '8.35% p.a.',
          quickActions: [
            { label: 'Simulate ₹45L EMI', actionType: 'open_emi', payload: { amount: 4500000, rate: 8.4, tenure: 20 } },
            { label: 'Compare SBI vs HDFC', actionType: 'open_compare' },
            { label: 'Home Loan Docs', actionType: 'open_checklist', payload: { category: 'home' } },
          ],
        },
      },
      personal: {
        text: 'On ₹55,000–₹60,000 net salary, banks allow up to 50%–55% FOIR (~₹27,500–₹30,000 EMI capacity):\n• Safe Sanction Limit: ₹10 Lakh to ₹12.5 Lakh over 5 years.\n• Rates: 10.50%–11.75% p.a. for prime salaried profiles.\n• Tip: Avoid applying to multiple apps at once—use your existing salary bank first for zero-doc top-up rates.',
        vernacularNativeSlang: 'Boss, on a 55 to 60 thousand monthly salary, you can comfortably pull about 10 to 12.5 lakh over 5 years, provided your existing EMIs are low. Always check with your salary account bank first—they usually waive processing fees and approve in hours!',
        phoneticColloquialSlang: 'Boss, on a 55 to 60 thousand monthly salary, you can comfortably pull about 10 to 12.5 lakh over 5 years, provided your existing EMIs are low.',
        dialectLabel: 'Indian Conversational English (en-IN)',
        metadata: {
          estimatedAmount: 1100000,
          recommendedRate: '10.65% p.a.',
          quickActions: [
            { label: 'Check Eligibility', actionType: 'open_eligibility', payload: { category: 'personal' } },
            { label: 'Plan ₹11L EMI', actionType: 'open_emi', payload: { amount: 1100000, rate: 10.65, tenure: 5 } },
          ],
        },
      },
      vehicle: {
        text: 'Vehicle Loan Insights:\n• Rates start at 8.75% p.a. for new cars and 8.50% for Electric Vehicles (0.25% green discount).\n• Up to 90%–100% on-road funding is available for salaried & ITR-verified self-employed applicants.',
        vernacularNativeSlang: 'Looking at a new ride? Car loans are super smooth right now around 8.75 percent, and if you pick an EV, banks knock off another quarter percent! Stick to a 5-year tenure so you do not overpay interest on a depreciating asset.',
        phoneticColloquialSlang: 'Looking at a new ride? Car loans are super smooth right now around 8.75 percent, and if you pick an EV, banks knock off another quarter percent!',
        dialectLabel: 'Indian Conversational English (en-IN)',
        metadata: {
          estimatedAmount: 1200000,
          recommendedRate: '8.75% p.a.',
          quickActions: [
            { label: 'Calculate Car EMI', actionType: 'open_emi', payload: { amount: 1200000, rate: 8.75, tenure: 5 } },
            { label: 'Vehicle Docs', actionType: 'open_checklist', payload: { category: 'vehicle' } },
          ],
        },
      },
      education: {
        text: 'Education Loan Insights:\n• Up to ₹7.5 Lakh collateral-free under Vidya Lakshmi / Credit Guarantee schemes; up to ₹40L–₹75L unsecured for premier global universities.\n• Full moratorium during study + 6 to 12 months, plus unlimited Sec 80E tax deduction on interest.',
        vernacularNativeSlang: 'For higher studies, you do not have to pay a single rupee during your course plus up to 12 months after graduation! Premier universities even get collateral-free funding up to 50 to 75 lakhs, and every rupee of interest is tax-deductible under 80E.',
        phoneticColloquialSlang: 'For higher studies, you do not have to pay a single rupee during your course plus up to 12 months after graduation!',
        dialectLabel: 'Indian Conversational English (en-IN)',
        metadata: {
          estimatedAmount: 2500000,
          recommendedRate: '8.50% p.a.',
          quickActions: [
            { label: 'Student Checklist', actionType: 'open_checklist', payload: { category: 'education' } },
            { label: 'Education EMI', actionType: 'open_emi', payload: { amount: 2500000, rate: 8.5, tenure: 10 } },
          ],
        },
      },
      business: {
        text: 'Business & MSME Loan Insights:\n• MUDRA (up to ₹10 Lakh) & CGTMSE collateral-free loans up to ₹2 Crore.\n• Keep 12 months of GSTR-3B returns and clean current account banking cashflow ready for lowest 9.25%–11.5% rates.',
        vernacularNativeSlang: 'For expanding your business, use CGTMSE or MUDRA schemes so you do not have to pledge family property! Just keep your GST filings and 12-month current account statements super clean—banks love consistent monthly turnover.',
        phoneticColloquialSlang: 'For expanding your business, use CGTMSE or MUDRA schemes so you do not have to pledge family property!',
        dialectLabel: 'Indian Conversational English (en-IN)',
        metadata: {
          estimatedAmount: 2500000,
          recommendedRate: '9.50% p.a.',
          quickActions: [
            { label: 'MSME Checklist', actionType: 'open_checklist', payload: { category: 'business' } },
            { label: 'Plan Business EMI', actionType: 'open_emi', payload: { amount: 2500000, rate: 9.5, tenure: 7 } },
          ],
        },
      },
      agriculture: {
        text: 'Kisan Credit Card (KCC) 4% Subsidy Explained:\n• Base crop loan interest is 7.0% p.a. up to ₹3 Lakh.\n• On timely repayment within 1 year, the Govt provides a 3% Prompt Repayment Incentive (PRI) — bringing your effective rate down to just 4.0% p.a.!',
        vernacularNativeSlang: 'Here is the best secret in Indian banking: Kisan Credit Card starts at 7 percent, and if you repay on time within a year, you get an instant 3 percent government subsidy—making your actual interest just 4 percent! Zero collateral needed up to 1.6 lakh.',
        phoneticColloquialSlang: 'Kisan Credit Card starts at 7 percent, and if you repay on time within a year, you get an instant 3 percent subsidy—making your actual rate just 4 percent!',
        dialectLabel: 'Indian Conversational English (en-IN)',
        metadata: {
          estimatedAmount: 300000,
          recommendedRate: '4.00% p.a.',
          quickActions: [
            { label: 'Calculate 4% EMI', actionType: 'open_emi', payload: { amount: 300000, rate: 4.0, tenure: 3 } },
            { label: 'Farmer Docs (7/12)', actionType: 'open_checklist', payload: { category: 'agriculture' } },
          ],
        },
      },
      compare: {
        text: 'SBI vs HDFC Comparison:\n• SBI: 8.40% starting, ₹10,000 capped processing fee, slightly longer 5–7 day paperwork.\n• HDFC: 8.50% starting, ultra-fast 48-hour sanction, doorstep document pickup.\n• Both have ZERO prepayment charges for individual floating-rate borrowers per RBI rules.',
        vernacularNativeSlang: 'Quick comparison: SBI wins on lowest lifetime cost and capped processing fee, while HDFC wins on sheer speed—approval in 48 hours! And remember, per RBI rules, neither bank can charge you a single rupee for prepaying a floating-rate home loan.',
        phoneticColloquialSlang: 'Quick comparison: SBI wins on lowest lifetime cost and capped processing fee, while HDFC wins on sheer speed—approval in 48 hours!',
        dialectLabel: 'Indian Conversational English (en-IN)',
        metadata: {
          quickActions: [
            { label: 'Open Full Bank Matrix', actionType: 'open_compare' },
          ],
        },
      },
      cibil: {
        text: '30-Day CIBIL Boost Plan:\n1. Drop credit card utilization below 30% before statement generation.\n2. Avoid submitting multiple loan applications (hard inquiries).\n3. Keep a clean 100% on-time EMI/card payment record and dispute any old settled/closed errors.',
        vernacularNativeSlang: 'Want to jump your CIBIL fast? Keep your credit card usage under 30 percent before the bill generates, never hit apply on 4 loan apps in one week, and keep auto-pay on for every single rupee!',
        phoneticColloquialSlang: 'Keep your credit card usage under 30 percent before the bill generates and avoid multiple hard inquiries!',
        dialectLabel: 'Indian Conversational English (en-IN)',
        metadata: {
          quickActions: [
            { label: 'Test CIBIL Impact', actionType: 'open_eligibility' },
          ],
        },
      },
      gov: {
        text: 'Government & PSU Employee Perks:\n• Higher 60%–65% FOIR limit expands your sanction amount by 15%–20%.\n• SBI Shaurya / Privilege & Bank of Baroda offer 0.25% rate concessions and zero processing fees.',
        vernacularNativeSlang: 'Govt and PSU employees get VIP treatment from SBI and Bank of Baroda! You qualify for up to 65 percent FOIR capacity, zero processing fees, and an instant quarter-percent rate cut.',
        phoneticColloquialSlang: 'Govt and PSU employees get up to 65 percent FOIR capacity, zero processing fees, and a quarter-percent rate cut!',
        dialectLabel: 'Indian Conversational English (en-IN)',
        metadata: {
          estimatedAmount: 5500000,
          recommendedRate: '8.15% p.a.',
          quickActions: [
            { label: 'Check PSU Limit', actionType: 'open_eligibility', payload: { category: 'home' } },
          ],
        },
      },
      freelancer: {
        text: 'Freelancer & Gig Worker Approval Route:\n• Banks evaluate 2 years of ITR (Sec 44ADA 50% presumptive tax profit is accepted!) + 12-month bank statement cashflow.\n• Keep Form 26AS and client retainer contracts organized.',
        vernacularNativeSlang: 'Being a freelancer does not stop you from getting prime loans! Use Section 44ADA in your ITR and maintain steady 12-month bank inflows—ICICI and HDFC approve based on your cashflow trail.',
        phoneticColloquialSlang: 'Use Section 44ADA in your ITR and maintain steady 12-month bank inflows for fast freelancer loan approvals.',
        dialectLabel: 'Indian Conversational English (en-IN)',
        metadata: {
          quickActions: [
            { label: 'Freelancer Checklist', actionType: 'open_checklist', payload: { category: 'vehicle' } },
          ],
        },
      },
      retired: {
        text: 'Retired / Pensioner Loan Options:\n• SBI Jai Jawan / Pension Loan offers up to ₹14 Lakh based on 18x net monthly pension with minimal processing fees.',
        vernacularNativeSlang: 'Pensioners can easily unlock up to 14 lakh through SBI Pension Loan with super soft interest rates—just keep your PPO copy and pension account statements handy.',
        phoneticColloquialSlang: 'Pensioners can unlock up to 14 lakh through SBI Pension Loan using your PPO copy and pension slips.',
        dialectLabel: 'Indian Conversational English (en-IN)',
        metadata: {
          estimatedAmount: 800000,
          recommendedRate: '10.90% p.a.',
          quickActions: [
            { label: 'Pensioner Checklist', actionType: 'open_checklist', payload: { category: 'personal' } },
          ],
        },
      },
      homemaker: {
        text: 'Homemaker Co-Applicant Advantage:\n• Joint home loans with a woman co-applicant unlock 0.05%–0.10% interest concessions and state stamp duty rebates of 1%–2%!',
        vernacularNativeSlang: 'Adding a homemaker as a co-applicant or primary owner on a home loan is a smart financial hack—you get lower interest rates plus big stamp duty savings at registration!',
        phoneticColloquialSlang: 'Adding a homemaker as co-applicant unlocks lower interest rates and big stamp duty savings!',
        dialectLabel: 'Indian Conversational English (en-IN)',
        metadata: {
          quickActions: [
            { label: 'Co-Applicant Docs', actionType: 'open_checklist', payload: { category: 'home' } },
          ],
        },
      },
      general: {
        text: 'I can help you estimate your safe loan limit, compare SBI/HDFC/ICICI spreads, calculate monthly EMI with prepayment savings, and build your bank document dossier. Pick any tool below or ask a specific amount & salary!',
        vernacularNativeSlang: 'Got it! Tell me your monthly income and which loan you need—I will calculate your safe limit, pick the cheapest bank rate, and tell you the exact documents to keep ready.',
        phoneticColloquialSlang: 'Tell me your monthly income and loan type—I will calculate your safe limit and pick the best bank rate!',
        dialectLabel: 'Indian Conversational English (en-IN)',
        metadata: {
          quickActions: [
            { label: 'Check Eligibility', actionType: 'open_eligibility' },
            { label: 'Calculate EMI', actionType: 'open_emi' },
            { label: 'Compare Banks', actionType: 'open_compare' },
          ],
        },
      },
    },

    hi: {
      welcome: {
        text: 'नमस्ते! अपनी मासिक आय, CIBIL स्कोर या लोन की जरूरत बताएं—मैं सही बैंक, ब्याज दर और जरूरी कागज़ात आसान हिंदी में समझाऊँगा।',
        vernacularNativeSlang: 'अरे नमस्ते जी! बताइए, कौन सा लोन प्लान कर रहे हैं—घर का, गाड़ी का, पर्सनल या बिज़नेस? मैं बिल्कुल सीधी-सादी भाषा में सबसे कम ब्याज वाला बैंक और सही जुगाड़ बता दूँगा।',
        phoneticColloquialSlang: 'Namaste ji! Bataiye kaun sa loan plan kar rahe hain—ghar ka, gaadi ka, personal ya business? Main aapko sabse kam byaaj wala bank aur sahi rasta bata dunga.',
        dialectLabel: 'सहज बोलचाल की हिंदी (Hindustani Slang)',
      },
      home: {
        text: '760 CIBIL पर ₹45 लाख होम लोन के लिए:\n• सबसे सस्ता: SBI और बैंक ऑफ बड़ौदा (8.35%–8.40% सालाना), जीरो प्रीपेमेंट चार्ज।\n• सबसे तेज़: HDFC और ICICI (48–72 घंटे में मंजूरी)।\n• प्रो टिप: महिला सह-आवेदक जोड़ने पर ब्याज और स्टाम्प ड्यूटी दोनों में छूट मिलती है।',
        vernacularNativeSlang: 'देखिए बॉस, 760 का तगड़ा सिबिल स्कोर है तो सीधे SBI या बैंक ऑफ बड़ौदा पकड़िए—लगभग 8.35 से 8.40 परसेंट में मिल जाएगा और जल्दी पैसे चुकाने पर एक रुपया पेनाल्टी नहीं! अगर दो दिन में झटपट मंजूरी चाहिए तो HDFC बढ़िया है। हाँ, घर की महिला का नाम जोड़ना मत भूलिएगा, स्टाम्प ड्यूटी भी बचेगी!',
        phoneticColloquialSlang: 'Dekhiye boss, 760 ka tagda CIBIL score hai toh seedhe SBI ya Bank of Baroda pakadiye, 8.35 se 8.40 percent mein mil jayega aur zero prepayment charge! Agar 2 din mein jaldi chahiye toh HDFC badhiya hai.',
        dialectLabel: 'बोलचाल की हिंदी (Hindi Colloquial)',
        metadata: {
          estimatedAmount: 4500000,
          recommendedRate: '8.35% p.a.',
          quickActions: [
            { label: '₹45L की EMI देखें', actionType: 'open_emi', payload: { amount: 4500000, rate: 8.4, tenure: 20 } },
            { label: 'SBI vs HDFC तुलना', actionType: 'open_compare' },
            { label: 'जरूरी कागज़ात', actionType: 'open_checklist', payload: { category: 'home' } },
          ],
        },
      },
      personal: {
        text: '₹55,000–₹60,000 सैलरी पर पात्रता:\n• सुरक्षित लोन सीमा: ₹10 लाख से ₹12.5 लाख (5 साल के लिए)।\n• ब्याज दर: 10.50%–11.75% सालाना।\n• सलाह: एक साथ 4 ऐप पर अप्लाई न करें; पहले अपने सैलरी अकाउंट बैंक से प्री-अप्रूव्ड ऑफर चेक करें।',
        vernacularNativeSlang: 'सुनिए, 55 से 60 हज़ार सैलरी है और पहले से कोई बड़ा कर्ज नहीं है, तो आराम से 10 से 12 लाख तक पर्सनल लोन मिल जाएगा! सबसे पहले अपने सैलरी वाले बैंक में चेक करिए—बिना कागज़ के घंटे भर में पैसा आ जाता है और प्रोसेसिंग फीस भी कम लगती है।',
        phoneticColloquialSlang: 'Suniye, 55 se 60 hazaar salary par aaraam se 10 se 12 lakh tak personal loan mil jayega. Pehle apne salary wale bank mein check kariye, ghante bhar mein approval mil jata hai!',
        dialectLabel: 'बोलचाल की हिंदी (Hindi Colloquial)',
        metadata: {
          estimatedAmount: 1100000,
          recommendedRate: '10.65% p.a.',
          quickActions: [
            { label: 'पात्रता जांचें', actionType: 'open_eligibility', payload: { category: 'personal' } },
            { label: 'EMI प्लान करें', actionType: 'open_emi', payload: { amount: 1100000, rate: 10.65, tenure: 5 } },
          ],
        },
      },
      vehicle: {
        text: 'वाहन लोन:\n• नई कार पर 8.75% और EV (इलेक्ट्रिक वाहन) पर 8.50% से शुरुआत।\n• ऑन-रोड कीमत का 90% तक फंडिंग संभव।',
        vernacularNativeSlang: 'नई गाड़ी लेने का प्लान है? कार लोन अभी 8.75 परसेंट के आसपास चल रहा है, और इलेक्ट्रिक गाड़ी लेंगे तो बैंक पच्चीस पैसे और छूट देता है। कोशिश करिए कि अवधि 5 साल से ज़्यादा न रखें।',
        phoneticColloquialSlang: 'Nayi gaadi lene ka plan hai? Car loan abhi 8.75 percent ke aaspaas hai, aur EV par aur chhoot milti hai!',
        dialectLabel: 'बोलचाल की हिंदी (Hindi Colloquial)',
        metadata: {
          estimatedAmount: 1200000,
          recommendedRate: '8.75% p.a.',
          quickActions: [
            { label: 'वाहन EMI जांचें', actionType: 'open_emi', payload: { amount: 1200000, rate: 8.75, tenure: 5 } },
          ],
        },
      },
      education: {
        text: 'शिक्षा लोन:\n• ₹7.5 लाख तक बिना गारंटी लोन और पढ़ाई पूरी होने के 12 महीने बाद तक EMI से छुट्टी।\n• धारा 80E के तहत पूरे ब्याज पर टैक्स छूट।',
        vernacularNativeSlang: 'पढ़ाई के लिए लोन ले रहे हैं तो टेंशन मत लीजिए—कोर्स खत्म होने के एक साल बाद तक एक रुपया किस्त नहीं देनी होती, और ब्याज पर पूरा टैक्स माफ होता है!',
        phoneticColloquialSlang: 'Padhai ke liye loan mein course khatam hone ke ek saal baad tak EMI nahi deni hoti, aur tax chhoot bhi milti hai!',
        dialectLabel: 'बोलचाल की हिंदी (Hindi Colloquial)',
        metadata: {
          estimatedAmount: 2500000,
          recommendedRate: '8.50% p.a.',
          quickActions: [
            { label: 'छात्र दस्तावेज़', actionType: 'open_checklist', payload: { category: 'education' } },
          ],
        },
      },
      business: {
        text: 'बिज़नेस / MSME लोन:\n• मुद्रा (₹10 लाख तक) और CGTMSE के तहत ₹2 करोड़ तक बिना जमीन-जायदाद गिरवी रखे लोन।',
        vernacularNativeSlang: 'बिज़नेस बढ़ाना है तो दुकान या घर गिरवी रखने की जरूरत नहीं—CGTMSE और मुद्रा योजना में बिना गारंटी लोन मिल जाता है। बस अपने GST रिटर्न और बैंक स्टेटमेंट साफ रखिए!',
        phoneticColloquialSlang: 'Business badhane ke liye CGTMSE aur Mudra yojana mein bina girvi ke loan mil jata hai, bas GST filing saaf rakhiye!',
        dialectLabel: 'बोलचाल की हिंदी (Hindi Colloquial)',
        metadata: {
          estimatedAmount: 2500000,
          recommendedRate: '9.50% p.a.',
          quickActions: [
            { label: 'MSME कागज़ात', actionType: 'open_checklist', payload: { category: 'business' } },
          ],
        },
      },
      agriculture: {
        text: 'किसान क्रेडिट कार्ड (KCC) 4% छूट:\n• खेती के लिए ₹3 लाख तक 7% सालाना ब्याज पर लोन मिलता है।\n• समय पर एक साल के भीतर चुकाने पर सरकार 3% अतिरिक्त छूट देती है — यानी असली ब्याज सिर्फ 4%!',
        vernacularNativeSlang: 'किसान भाइयों के लिए सबसे बढ़िया बात: KCC में वैसे तो 7 परसेंट ब्याज लगता है, लेकिन अगर एक साल के अंदर समय पर पैसा लौटा दिया, तो सरकार 3 परसेंट सब्सिडी वापस दे देती है—मतलब कुल ब्याज सिर्फ 4 परसेंट! एक लाख साठ हज़ार तक कोई गारंटी भी नहीं।',
        phoneticColloquialSlang: 'KCC mein 7 percent byaaj lagta hai, par samay par wapas karne par sarkar 3 percent chhoot deti hai—yaani asli byaaj sirf 4 percent!',
        dialectLabel: 'देसी बोलचाल हिंदी (Desi Hindi)',
        metadata: {
          estimatedAmount: 300000,
          recommendedRate: '4.00% p.a.',
          quickActions: [
            { label: '4% EMI गणना', actionType: 'open_emi', payload: { amount: 300000, rate: 4.0, tenure: 3 } },
            { label: 'खतौनी / KCC कागज़', actionType: 'open_checklist', payload: { category: 'agriculture' } },
          ],
        },
      },
      compare: {
        text: 'SBI बनाम HDFC:\n• SBI: सबसे कम ब्याज (8.40%) और सीमित फीस (₹10,000 तक)।\n• HDFC: 48 घंटे में सुपर-फास्ट मंजूरी और घर बैठे सेवा।',
        vernacularNativeSlang: 'सीधा हिसाब समझिए: पैसा बचाना है तो SBI बेस्ट है क्योंकि ब्याज और फीस दोनों कम हैं; और अगर काम एकदम अर्जेंट है तो HDFC दो दिन में लोन पास कर देता है!',
        phoneticColloquialSlang: 'Seedha hisaab samajhiye: paisa bachana hai toh SBI best hai, aur urgent hai toh HDFC 2 din mein pass kar deta hai!',
        dialectLabel: 'बोलचाल की हिंदी (Hindi Colloquial)',
        metadata: { quickActions: [{ label: 'पूरी बैंक तालिका देखें', actionType: 'open_compare' }] },
      },
      cibil: {
        text: 'CIBIL बढ़ाने का 30-दिन का फॉर्मूला:\n1. क्रेडिट कार्ड का इस्तेमाल 30% से कम रखें।\n2. बार-बार लोन अप्लाई न करें।',
        vernacularNativeSlang: 'सिबिल फटाफट ऊपर लाना है तो क्रेडिट कार्ड की लिमिट का तीस परसेंट से कम ही खर्च करिए और हर हफ्ते नए लोन ऐप पर चेक मत मारिए!',
        phoneticColloquialSlang: 'CIBIL badhane ke liye credit card limit ka 30 percent se kam use karein aur baar-baar apply na karein!',
        dialectLabel: 'बोलचाल की हिंदी (Hindi Colloquial)',
        metadata: { quickActions: [{ label: 'पात्रता जांचें', actionType: 'open_eligibility' }] },
      },
      gov: {
        text: 'सरकारी / PSU कर्मचारियों को SBI व बैंक ऑफ बड़ौदा में 0.25% कम ब्याज, शून्य प्रोसेसिंग फीस और 65% तक FOIR सीमा मिलती है।',
        vernacularNativeSlang: 'अरे सरकारी नौकरी वालों की तो चांदी है! SBI और BOB में प्रोसेसिंग फीस माफ और ब्याज में भी एक चौथाई परसेंट की सीधी छूट मिलती है।',
        phoneticColloquialSlang: 'Sarkari naukri walon ko SBI aur BOB mein zero processing fee aur 0.25 percent sasta byaaj milta hai!',
        dialectLabel: 'बोलचाल की हिंदी (Hindi Colloquial)',
        metadata: { quickActions: [{ label: 'PSU पात्रता देखें', actionType: 'open_eligibility' }] },
      },
      freelancer: {
        text: 'फ्रीलांसर 2 साल का ITR (Sec 44ADA) और 12 महीने के बैंक स्टेटमेंट के आधार पर आसानी से लोन ले सकते हैं।',
        vernacularNativeSlang: 'फ्रीलांसर हैं तो घबराएं नहीं—ITR में 44ADA भरिए और बैंक स्टेटमेंट मजबूत रखिए, HDFC और ICICI आराम से लोन देते हैं!',
        phoneticColloquialSlang: 'Freelancer ITR mein 44ADA aur 12 mahine ke bank statement se aaraam se loan le sakte hain!',
        dialectLabel: 'बोलचाल की हिंदी (Hindi Colloquial)',
        metadata: { quickActions: [{ label: 'दस्तावेज़ देखें', actionType: 'open_checklist' }] },
      },
      retired: {
        text: 'पेंशनर्स को SBI पेंशन लोन के तहत PPO और पेंशन स्लिप पर ₹14 लाख तक आसानी से मिल जाता है।',
        vernacularNativeSlang: 'पेंशनधारकों के लिए SBI पेंशन लोन सबसे आसान है—बस PPO की कॉपी और पेंशन स्लिप लगाएं और कम ब्याज में पैसे पाएं।',
        phoneticColloquialSlang: 'Pensioners ke liye SBI Pension Loan sabse aasan hai, bas PPO copy aur pension slip lagayein!',
        dialectLabel: 'बोलचाल की हिंदी (Hindi Colloquial)',
        metadata: { quickActions: [{ label: 'पेंशनर दस्तावेज़', actionType: 'open_checklist' }] },
      },
      homemaker: {
        text: 'गृहिणी को होम लोन में सह-आवेदक बनाने पर ब्याज दर में 0.05% छूट और रजिस्ट्री स्टाम्प ड्यूटी में बचत होती है।',
        vernacularNativeSlang: 'घर के लोन में मैडम जी को को-एप्लीकेंट बनाइए—ब्याज भी कम लगेगा और रजिस्ट्री के वक्त स्टाम्प ड्यूटी में हज़ारों रुपये बचेंगे!',
        phoneticColloquialSlang: 'Home loan mein grahini ko co-applicant banane se byaaj kam aur stamp duty mein bachat hoti hai!',
        dialectLabel: 'बोलचाल की हिंदी (Hindi Colloquial)',
        metadata: { quickActions: [{ label: 'को-एप्लीकेंट लिस्ट', actionType: 'open_checklist', payload: { category: 'home' } }] },
      },
      general: {
        text: 'अपनी मासिक आय और लोन प्रकार बताएं—मैं सही बैंक, EMI और कागज़ात बताऊँगा।',
        vernacularNativeSlang: 'बताइए भाई, कितना लोन चाहिए और महीने की कमाई कितनी है? अभी आपका पूरा हिसाब निकाल देता हूँ!',
        phoneticColloquialSlang: 'Bataiye kitna loan chahiye aur mahine ki kamai kitni hai? Abhi hisaab nikaal deta hoon!',
        dialectLabel: 'बोलचाल की हिंदी (Hindi Colloquial)',
        metadata: { quickActions: [{ label: 'पात्रता जांचें', actionType: 'open_eligibility' }, { label: 'EMI देखें', actionType: 'open_emi' }] },
      },
    },

    kn: {
      welcome: {
        text: 'ನಮಸ್ಕಾರ! ನಿಮ್ಮ ತಿಂಗಳ ಆದಾಯ, ಸಾಲದ ಅಗತ್ಯ ಅಥವಾ ಬ್ಯಾಂಕ್ ಪ್ರಶ್ನೆ ಕೇಳಿ—ನಾನು ಸರಳ ಕನ್ನಡದಲ್ಲಿ ಉತ್ತರಿಸುತ್ತೇನೆ.',
        vernacularNativeSlang: 'ನಮಸ್ಕಾರ ಗುರುಗಳೇ! ಹೇಳಿ, ಯಾವ ಲೋನ್ ಪ್ಲಾನ್ ಮಾಡ್ತಿದ್ದೀರಾ—ಮನೆ ಲೋನ್, ಕಾರ್, ಪರ್ಸನಲ್ ಅಥವಾ ಬ್ಯುಸಿನೆಸ್? ಕಡಿಮೆ ಬಡ್ಡಿ ಕೊಡೋ ಬೆಸ್ಟ್ ಬ್ಯಾಂಕ್ ಯಾವ್ದು ಅಂತ ಸರಿಯಾಗಿ ಹೇಳ್ತೀನಿ ನೋಡಿ.',
        phoneticColloquialSlang: 'Namaskara guru! Yaava loan plan maadtiddeera—mane, car, personal athva business? Kadime baddi kodo best bank yaavdu anta heeltheeni.',
        dialectLabel: 'ಆಡುಮಾತಿನ ಕನ್ನಡ (Bengaluru Colloquial)',
      },
      home: {
        text: '760 CIBIL ಸ್ಕೋರ್‌ಗೆ ₹45 ಲಕ್ಷ ಗೃಹ ಸಾಲ:\n• ಕಡಿಮೆ ಬಡ್ಡಿ: SBI ಮತ್ತು ಬ್ಯಾಂಕ್ ಆಫ್ ಬರೋಡಾ (8.35%–8.40%), ಶೂನ್ಯ ಪ್ರಿಪೇಮೆಂಟ್ ಶುಲ್ಕ.\n• ವೇಗ: HDFC 48–72 ಗಂಟೆಯಲ್ಲಿ ಮಂಜೂರಾತಿ.',
        vernacularNativeSlang: 'ನೋಡಿ ಬಾಸ್, 760 CIBIL ಸ್ಕೋರ್ ಸಖತ್ತಾಗಿದೆ! ಸೀದಾ SBI ಅಥವಾ ಬ್ಯಾಂಕ್ ಆಫ್ ಬರೋಡಾಗೆ ಹೋಗಿ—8.35 ರಿಂದ 8.40 ಪರ್ಸೆಂಟ್ ಬಡ್ಡಿಗೆ ಸಿಗುತ್ತೆ, ಪ್ರಿಪೇಮೆಂಟ್ ಚಾರ್ಜ್ ಕೂಡ ಇಲ್ಲ. ಅರ್ಜೆಂಟ್ ಆಗಿ 2 ದಿನದಲ್ಲಿ ಬೇಕು ಅಂದ್ರೆ HDFC ಬೆಸ್ಟ್!',
        phoneticColloquialSlang: 'Nodi boss, 760 CIBIL score sakkath aagide! SBI athva BOB ge hogi, 8.35 percent baddi ge sigutte, zero prepayment charge!',
        dialectLabel: 'ಆಡುಮಾತಿನ ಕನ್ನಡ (Kannada Colloquial)',
        metadata: {
          estimatedAmount: 4500000,
          recommendedRate: '8.35% p.a.',
          quickActions: [
            { label: '₹45L EMI ಲೆಕ್ಕ', actionType: 'open_emi', payload: { amount: 4500000, rate: 8.4, tenure: 20 } },
            { label: 'ಬ್ಯಾಂಕ್ ಹೋಲಿಸಿ', actionType: 'open_compare' },
          ],
        },
      },
      personal: {
        text: '₹55,000–₹60,000 ಸಂಬಳಕ್ಕೆ ಸುಮಾರು ₹10–₹12.5 ಲಕ್ಷ ಪರ್ಸನಲ್ ಲೋನ್ (10.5%–11.75%) ಸಿಗುತ್ತದೆ.',
        vernacularNativeSlang: '55 ರಿಂದ 60 ಸಾವಿರ ಸಂಬಳ ಇದ್ರೆ ಆರಾಮಾಗಿ 10 ರಿಂದ 12 ಲಕ್ಷ ಪರ್ಸನಲ್ ಲೋನ್ ಸಿಗುತ್ತೆ! ಮೊದಲು ನಿಮ್ಮ ಸ್ಯಾಲರಿ ಅಕೌಂಟ್ ಬ್ಯಾಂಕ್‌ನಲ್ಲಿ ಕೇಳಿ, ಡಾಕ್ಯುಮೆಂಟ್ ಇಲ್ಲದೆ ಬೇಗ ಸಿಗುತ್ತೆ.',
        phoneticColloquialSlang: '55 to 60 saavira sambala idre aaraamaagi 10 to 12 lakh personal loan sigutte! Modalu nimma salary bank nalli keli.',
        dialectLabel: 'ಆಡುಮಾತಿನ ಕನ್ನಡ (Kannada Colloquial)',
        metadata: {
          estimatedAmount: 1100000,
          recommendedRate: '10.65% p.a.',
          quickActions: [{ label: 'ಅರ್ಹತೆ ನೋಡಿ', actionType: 'open_eligibility', payload: { category: 'personal' } }],
        },
      },
      vehicle: {
        text: 'ಹೊಸ ಕಾರ್‌ಗೆ 8.75% ಮತ್ತು EV ವಾಹನಗಳಿಗೆ 8.50% ರಿಂದ ಸಾಲ ಲಭ್ಯ.',
        vernacularNativeSlang: 'ಹೊಸ ಗಾಡಿ ತಗೋತಿದ್ದೀರಾ? EV ತಗೊಂಡ್ರೆ ಬಡ್ಡಿ ಇನ್ನೂ ಕಡಿಮೆ ಸಿಗುತ್ತೆ, ಅವಧಿನ 5 ವರ್ಷದ ಒಳಗೆ ಇಟ್ಕೊಳ್ಳಿ ಒಳ್ಳೇದು.',
        phoneticColloquialSlang: 'Hosa gaadi tagotiddeera? EV ge baddi innu kadime sigutte, 5 varsha olage itkolli.',
        dialectLabel: 'ಆಡುಮಾತಿನ ಕನ್ನಡ (Kannada Colloquial)',
        metadata: { estimatedAmount: 1200000, recommendedRate: '8.75% p.a.', quickActions: [{ label: 'ವಾಹನ EMI', actionType: 'open_emi', payload: { amount: 1200000, rate: 8.75, tenure: 5 } }] },
      },
      education: {
        text: 'ಶಿಕ್ಷಣ ಸಾಲದಲ್ಲಿ ಕೋರ್ಸ್ + 1 ವರ್ಷದವರೆಗೆ EMI ವಿನಾಯಿತಿ ಮತ್ತು Sec 80E ತೆರಿಗೆ ಉಳಿತಾಯ ಸಿಗುತ್ತದೆ.',
        vernacularNativeSlang: 'ಓದೋದಕ್ಕೆ ಲೋನ್ ತಗೊಂಡ್ರೆ ಕೋರ್ಸ್ ಮುಗ್ದು ಒಂದು ವರ್ಷ ಆದ್ಮೇಲೆ EMI ಕಟ್ಟಿದ್ರೆ ಸಾಕು, ಟ್ಯಾಕ್ಸ್ ಕೂಡ ಉಳಿಯುತ್ತೆ!',
        phoneticColloquialSlang: 'Education loan nalli course mugdu 1 varsha aadmele EMI kattidre saaku!',
        dialectLabel: 'ಆಡುಮಾತಿನ ಕನ್ನಡ (Kannada Colloquial)',
        metadata: { estimatedAmount: 2500000, recommendedRate: '8.50% p.a.', quickActions: [{ label: 'ದಾಖಲೆಗಳು', actionType: 'open_checklist', payload: { category: 'education' } }] },
      },
      business: {
        text: 'MSME / ಮುದ್ರಾ ಮತ್ತು CGTMSE ಅಡಿಯಲ್ಲಿ ₹2 ಕೋಟಿವರೆಗೆ ಆಧಾರರಹಿತ ಬ್ಯುಸಿನೆಸ್ ಸಾಲ ಲಭ್ಯ.',
        vernacularNativeSlang: 'ಬ್ಯುಸಿನೆಸ್ ಬೆಳೆಸೋಕೆ ಆಸ್ತಿ ಅಡ ಇಡೋ ಅಗತ್ಯ ಇಲ್ಲ—CGTMSE ಮತ್ತೆ ಮುದ್ರಾ ಲೋನ್‌ನಲ್ಲಿ ಗ್ಯಾರಂಟಿ ಇಲ್ಲದೆ ಸಾಲ ಸಿಗುತ್ತೆ, GST ಕ್ಲೀನ್ ಆಗಿರಲಿ ಅಷ್ಟೇ!',
        phoneticColloquialSlang: 'Business ge aasti ada ido agatya illa, CGTMSE mattu Mudra nalli guarantee illade loan sigutte!',
        dialectLabel: 'ಆಡುಮಾತಿನ ಕನ್ನಡ (Kannada Colloquial)',
        metadata: { estimatedAmount: 2500000, recommendedRate: '9.50% p.a.', quickActions: [{ label: 'MSME ದಾಖಲೆ', actionType: 'open_checklist', payload: { category: 'business' } }] },
      },
      agriculture: {
        text: 'ಕಿಸಾನ್ ಕ್ರೆಡಿಟ್ ಕಾರ್ಡ್ (KCC): 7% ಬಡ್ಡಿ; 1 ವರ್ಷದಲ್ಲಿ ಮರುಪಾವತಿ ಮಾಡಿದರೆ 3% ಸಬ್ಸಿಡಿ ಸೇರಿ ಕೇವಲ 4% ಬಡ್ಡಿ!',
        vernacularNativeSlang: 'ರೈತ ಬಾಂಧವರಿಗೆ ಸಖತ್ ಆಫರ್ ಇದು: KCC ಲೋನ್‌ಗೆ 7 ಪರ್ಸೆಂಟ್ ಬಡ್ಡಿ ಇದ್ರೂ, ಒಂದು ವರ್ಷದೊಳಗೆ ಸರಿಯಾಗಿ ಕಟ್ಟಿದ್ರೆ 3 ಪರ್ಸೆಂಟ್ ವಾಪಸ್ ಬರುತ್ತೆ—ಅಂದ್ರೆ ಬರಿ 4 ಪರ್ಸೆಂಟ್ ಬಡ್ಡಿ ಅಷ್ಟೇ!',
        phoneticColloquialSlang: 'KCC loan ge 7 percent baddi idru, samayakke kattidre 3 percent subsidy bandu bari 4 percent aagutte!',
        dialectLabel: 'ಗ್ರಾಮೀಣ ಕನ್ನಡ (Kannada Rural Slang)',
        metadata: { estimatedAmount: 300000, recommendedRate: '4.00% p.a.', quickActions: [{ label: '4% EMI ನೋಡಿ', actionType: 'open_emi', payload: { amount: 300000, rate: 4.0, tenure: 3 } }] },
      },
      compare: {
        text: 'SBI ಅತ್ಯಂತ ಕಡಿಮೆ ಬಡ್ಡಿ (8.40%) ಮತ್ತು ಶುಲ್ಕ ನೀಡುತ್ತದೆ; HDFC 48 ಗಂಟೆಯ ವೇಗದ ಅನುಮೋದನೆಗೆ ಉತ್ತಮ.',
        vernacularNativeSlang: 'ಹಣ ಉಳಿಸಬೇಕು ಅಂದ್ರೆ SBI ಬೆಸ್ಟ್, ಬೇಗ ಕೆಲಸ ಆಗ್ಬೇಕು ಅಂದ್ರೆ HDFC ಬೆಸ್ಟ್—ಎರಡರಲ್ಲೂ ಪ್ರಿಪೇಮೆಂಟ್ ಚಾರ್ಜ್ ಇಲ್ಲ!',
        phoneticColloquialSlang: 'Hana ulisbeku andre SBI best, bega aagbeku andre HDFC best!',
        dialectLabel: 'ಆಡುಮಾತಿನ ಕನ್ನಡ (Kannada Colloquial)',
        metadata: { quickActions: [{ label: 'ಬ್ಯಾಂಕ್ ಪಟ್ಟಿ', actionType: 'open_compare' }] },
      },
      cibil: { text: 'ಕ್ರೆಡಿಟ್ ಕಾರ್ಡ್ ಬಳಕೆಯನ್ನು 30% ಒಳಗೆ ಇಟ್ಟು ಸಮಯಕ್ಕೆ EMI ಕಟ್ಟಿ CIBIL ಹೆಚ್ಚಿಸಿ.', vernacularNativeSlang: 'CIBIL ಬೇಗ ಏರಿಸಬೇಕು ಅಂದ್ರೆ ಕಾರ್ಡ್ ಯೂಸೇಜ್ 30 ಪರ್ಸೆಂಟ್ ಒಳಗೆ ಇಡಿ ಮತ್ತು ಪದೇ ಪದೇ ಲೋನ್ ಅಪ್ಲೈ ಮಾಡ್ಬೇಡಿ.', phoneticColloquialSlang: 'Card usage 30 percent olage idi, CIBIL bega increase aagutte.', dialectLabel: 'ಆಡುಮಾತಿನ ಕನ್ನಡ', metadata: { quickActions: [{ label: 'ಅರ್ಹತೆ ನೋಡಿ', actionType: 'open_eligibility' }] } },
      gov: { text: 'ಸರ್ಕಾರಿ / PSU ನೌಕರರಿಗೆ 65% FOIR ಮತ್ತು 0.25% ಬಡ್ಡಿ ರಿಯಾಯಿತಿ ಸಿಗುತ್ತದೆ.', vernacularNativeSlang: 'ಸರ್ಕಾರಿ ನೌಕರರಿಗೆ SBI ನಲ್ಲಿ ಜೀರೋ ಪ್ರೊಸೆಸಿಂಗ್ ಫೀ ಮತ್ತು ಕಾಲು ಪರ್ಸೆಂಟ್ ಬಡ್ಡಿ ಕಡಿಮೆ ಸಿಗುತ್ತೆ!', phoneticColloquialSlang: 'Sarkari naukararige SBI nalli zero processing fee mattu kadime baddi sigutte!', dialectLabel: 'ಆಡುಮಾತಿನ ಕನ್ನಡ', metadata: { quickActions: [{ label: 'PSU ಅರ್ಹತೆ', actionType: 'open_eligibility' }] } },
      freelancer: { text: 'ಫ್ರೀಲ್ಯಾನ್ಸರ್‌ಗಳು 2 ವರ್ಷದ ITR (44ADA) ಮತ್ತು ಬ್ಯಾಂಕ್ ಸ್ಟೇಟ್‌ಮೆಂಟ್ ಮೂಲಕ ಸಾಲ ಪಡೆಯಬಹುದು.', vernacularNativeSlang: 'ಫ್ರೀಲ್ಯಾನ್ಸರ್ ಆದ್ರೂ ತಲೆ ಕೆಡಿಸಿಕೊಳ್ಳಬೇಡಿ, 44ADA ITR ಮತ್ತೆ ಬ್ಯಾಂಕ್ ಕ್ಯಾಶ್‌ಫ್ಲೋ ಇದ್ರೆ ಲೋನ್ ಪಕ್ಕಾ ಸಿಗುತ್ತೆ!', phoneticColloquialSlang: 'Freelancers 44ADA ITR mattu bank cashflow idre loan pakka sigutte!', dialectLabel: 'ಆಡುಮಾತಿನ ಕನ್ನಡ', metadata: { quickActions: [{ label: 'ದಾಖಲೆಗಳು', actionType: 'open_checklist' }] } },
      retired: { text: 'ನಿವೃತ್ತರು PPO ಮತ್ತು ಪಿಂಚಣಿ ಸ್ಲಿಪ್ ಮೇಲೆ ₹14 ಲಕ್ಷದವರೆಗೆ SBI ಪಿಂಚಣಿ ಸಾಲ ಪಡೆಯಬಹುದು.', vernacularNativeSlang: 'ಪಿಂಚಣಿದಾರರಿಗೆ PPO ಕಾಪಿ ಮೇಲೆ SBI ನಲ್ಲಿ ಕಡಿಮೆ ಬಡ್ಡಿಗೆ ಸುಲಭವಾಗಿ ಸಾಲ ಸಿಗುತ್ತೆ.', phoneticColloquialSlang: 'Pensioners ge PPO copy mele SBI nalli sulabhavaagi loan sigutte.', dialectLabel: 'ಆಡುಮಾತಿನ ಕನ್ನಡ', metadata: { quickActions: [{ label: 'ದಾಖಲೆಗಳು', actionType: 'open_checklist' }] } },
      homemaker: { text: 'ಗೃಹಿಣಿಯರನ್ನು ಸಹ-ಅರ್ಜಿದಾರರನ್ನಾಗಿ ಸೇರಿಸುವುದರಿಂದ ಮಹಿಳಾ ಬಡ್ಡಿ ರಿಯಾಯಿತಿ ಮತ್ತು ಸ್ಟಾಂಪ್ ಡ್ಯೂಟಿ ಉಳಿತಾಯ ಸಿಗುತ್ತದೆ.', vernacularNativeSlang: 'ಹೋಮ್ ಲೋನ್‌ನಲ್ಲಿ ಮಹಿಳಾ ಕೋ-ಅಪ್ಲಿಕಂಟ್ ಸೇರಿಸಿದ್ರೆ ಬಡ್ಡಿ ಜೊತೆ ರಿಜಿಸ್ಟ್ರೇಷನ್ ಸ್ಟಾಂಪ್ ಡ್ಯೂಟಿ ಕೂಡ ಉಳಿಯುತ್ತೆ!', phoneticColloquialSlang: 'Mahila co-applicant serisidre baddi mattu stamp duty uliyutte!', dialectLabel: 'ಆಡುಮಾತಿನ ಕನ್ನಡ', metadata: { quickActions: [{ label: 'ದಾಖಲೆಗಳು', actionType: 'open_checklist', payload: { category: 'home' } }] } },
      general: { text: 'ನಿಮ್ಮ ತಿಂಗಳ ಆದಾಯ ಮತ್ತು ಸಾಲದ ವಿಧ ತಿಳಿಸಿ.', vernacularNativeSlang: 'ನಿಮ್ಮ ತಿಂಗಳ ಸಂಬಳ ಎಷ್ಟು ಮತ್ತೆ ಯಾವ ಲೋನ್ ಬೇಕು ಹೇಳಿ, ಈಗಲೇ ಲೆಕ್ಕ ಹಾಕಿ ಕೊಡ್ತೀನಿ!', phoneticColloquialSlang: 'Nimma tingala sambala eshtu mattu yaava loan beku heli!', dialectLabel: 'ಆಡುಮಾತಿನ ಕನ್ನಡ', metadata: { quickActions: [{ label: 'ಅರ್ಹತೆ ನೋಡಿ', actionType: 'open_eligibility' }, { label: 'EMI ಲೆಕ್ಕ', actionType: 'open_emi' }] } },
    },

    ta: {
      welcome: {
        text: 'வணக்கம்! உங்கள் மாத வருமானம், CIBIL அல்லது கடன் தேவையைச் சொல்லுங்கள்—சரியான வங்கியையும் வட்டியையும் தமிழில் விளக்குகிறேன்.',
        vernacularNativeSlang: 'வணக்கம் பாஸ்! சொல்லுங்க, எந்த லோன் பாக்குறீங்க—வீடு, கார், பர்சனல் இல்ல பிசினஸ்? கம்மி வட்டியில எந்த பேங்க் பெஸ்ட்-னு தெளிவா சொல்லிட்றேன்.',
        phoneticColloquialSlang: 'Vanakkam boss! Endha loan paakureenga—veedu, car, personal illa business? Kammi vattiyila endha bank best-nu sollidren.',
        dialectLabel: 'பேச்சுத் தமிழ் (Chennai Conversational)',
      },
      home: {
        text: '760 CIBIL-க்கு ₹45 லட்சம் வீட்டுக் கடன்:\n• குறைந்த வட்டி: SBI & Bank of Baroda (8.35%–8.40%), முன்பணம் செலுத்த கட்டணமில்லை.\n• வேகம்: HDFC 48 மணி நேரத்தில் ஒப்புதல்.',
        vernacularNativeSlang: 'பாஸ், 760 CIBIL சூப்பரா இருக்கு! நேரா SBI இல்ல பேங்க் ஆஃப் பரோடா போங்க—8.35 ல இருந்து 8.40 பர்சன்ட் வட்டியில கிடைக்கும், முன்கூட்டியே க்ளோஸ் பண்ணா கூட சார்ஜ் இல்லை. ரெண்டு நாள்ல அவசரமா வேணும்னா HDFC பெஸ்ட்!',
        phoneticColloquialSlang: 'Boss, 760 CIBIL super-aa irukku! Nera SBI illa BOB ponga, 8.35 percent-la kidaikkum, zero prepayment charge!',
        dialectLabel: 'பேச்சுத் தமிழ் (Tamil Colloquial)',
        metadata: {
          estimatedAmount: 4500000,
          recommendedRate: '8.35% p.a.',
          quickActions: [
            { label: '₹45L EMI பார்க்க', actionType: 'open_emi', payload: { amount: 4500000, rate: 8.4, tenure: 20 } },
            { label: 'வங்கிகளை ஒப்பிடு', actionType: 'open_compare' },
          ],
        },
      },
      personal: {
        text: '₹55,000–₹60,000 சம்பளத்திற்கு 5 ஆண்டில் ₹10–₹12.5 லட்சம் வரை தனிநபர் கடன் கிடைக்கும்.',
        vernacularNativeSlang: '55 ஆயிரம் சம்பளம் வாங்குறீங்கன்னா ஈஸியா 10 ல இருந்து 12 லட்சம் வரைக்கும் பர்சனல் லோன் எடுக்கலாம்! முதல்ல உங்க சேலரி அக்கவுண்ட் பேங்க்ல கேளுங்க, டக்குனு அப்ரூவல் ஆயிடும்.',
        phoneticColloquialSlang: '55 aayiram sambalam-na easy-aa 10 to 12 lakh personal loan kidaikkum! Salary bank-la kelunga.',
        dialectLabel: 'பேச்சுத் தமிழ் (Tamil Colloquial)',
        metadata: { estimatedAmount: 1100000, recommendedRate: '10.65% p.a.', quickActions: [{ label: 'தகுதி சரிபார்', actionType: 'open_eligibility', payload: { category: 'personal' } }] },
      },
      vehicle: {
        text: 'புதிய காருக்கு 8.75% மற்றும் EV வாகனங்களுக்கு 8.50% வட்டியில் 90% ஆன்-ரோடு கடன்.',
        vernacularNativeSlang: 'புது வண்டி வாங்குறீங்களா? எலக்ட்ரிக் வண்டி எடுத்தா வட்டி இன்னும் கம்மி பண்ணி தருவாங்க, 5 வருஷத்துக்கு மேல போகாம பாத்துக்கோங்க.',
        phoneticColloquialSlang: 'Pudhu vandi vaangureengala? EV-kku vatti innu kammiyaa kidaikkum!',
        dialectLabel: 'பேச்சுத் தமிழ் (Tamil Colloquial)',
        metadata: { estimatedAmount: 1200000, recommendedRate: '8.75% p.a.', quickActions: [{ label: 'வாகன EMI', actionType: 'open_emi', payload: { amount: 1200000, rate: 8.75, tenure: 5 } }] },
      },
      education: {
        text: 'படிப்பு + 12 மாதங்களுக்கு EMI சலுகை மற்றும் Sec 80E வரி விலக்கு கிடைக்கும்.',
        vernacularNativeSlang: 'படிப்பு லோன் எடுத்தா படிச்சு முடிச்சு ஒரு வருஷம் வரைக்கும் ஒரு ரூபா கூட கட்ட வேணாம், வட்டிக்கும் ஃபுல் டாக்ஸ் விலக்கு உண்டு!',
        phoneticColloquialSlang: 'Education loan-la padichu mudichu 1 varusham varaikkum EMI katta venaam!',
        dialectLabel: 'பேச்சுத் தமிழ் (Tamil Colloquial)',
        metadata: { estimatedAmount: 2500000, recommendedRate: '8.50% p.a.', quickActions: [{ label: 'ஆவணப் பட்டியல்', actionType: 'open_checklist', payload: { category: 'education' } }] },
      },
      business: {
        text: 'முத்ரா மற்றும் CGTMSE திட்டத்தில் ₹2 கோடி வரை பிணையில்லா தொழில் கடன்.',
        vernacularNativeSlang: 'பிசினஸ் பெருசாக்க சொத்து அடமானம் வைக்க தேவையில்லை—CGTMSE முத்ரா திட்டத்துல கேரண்டி இல்லாம லோன் கிடைக்கும், GST கணக்கு மட்டும் கரெக்டா வைங்க!',
        phoneticColloquialSlang: 'Business-kku CGTMSE Mudra scheme-la guarantee illama loan kidaikkum!',
        dialectLabel: 'பேச்சுத் தமிழ் (Tamil Colloquial)',
        metadata: { estimatedAmount: 2500000, recommendedRate: '9.50% p.a.', quickActions: [{ label: 'MSME ஆவணங்கள்', actionType: 'open_checklist', payload: { category: 'business' } }] },
      },
      agriculture: {
        text: 'கிசான் கிரெடிட் கார்டு (KCC): 7% வட்டி; 1 ஆண்டுக்குள் திரும்பச் செலுத்தினால் 3% மானியத்துடன் வெறும் 4% வட்டி!',
        vernacularNativeSlang: 'விவசாயிகளுக்கான சூப்பர் திட்டம்: KCC-ல 7 பர்சன்ட் வட்டி போட்டாலும், ஒரு வருஷத்துக்குள்ள கரெக்டா கட்டிட்டா 3 பர்சன்ட் மானியம் வந்து வெறும் 4 பர்சன்ட் வட்டி தான்!',
        phoneticColloquialSlang: 'KCC-la 1 varushathukkulla kattitta 3 percent maaniyam vandhu verum 4 percent vatti dhaan!',
        dialectLabel: 'மக்கள் தமிழ் (Tamil Rural)',
        metadata: { estimatedAmount: 300000, recommendedRate: '4.00% p.a.', quickActions: [{ label: '4% EMI கணக்கு', actionType: 'open_emi', payload: { amount: 300000, rate: 4.0, tenure: 3 } }] },
      },
      compare: {
        text: 'SBI குறைந்த வட்டிக்கும் (8.40%), HDFC 48 மணி நேர வேக ஒப்புதலுக்கும் சிறந்தது.',
        vernacularNativeSlang: 'வட்டி மிச்சம் பண்ணனும்னா SBI-க்கு போங்க, ரெண்டு நாள்ல உடனே லோன் வேணும்னா HDFC-யை பிடிங்க!',
        phoneticColloquialSlang: 'Vatti micham pannanum-na SBI, vegamaa venum-na HDFC!',
        dialectLabel: 'பேச்சுத் தமிழ் (Tamil Colloquial)',
        metadata: { quickActions: [{ label: 'வங்கி ஒப்பீடு', actionType: 'open_compare' }] },
      },
      cibil: { text: 'கிரெடிட் கார்டு பயன்பாட்டை 30%-க்கு கீழ் வைத்து CIBIL-ஐ உயர்த்துங்கள்.', vernacularNativeSlang: 'கார்டு லிமிட்டை 30 பர்சன்ட்க்கு உள்ளேயே யூஸ் பண்ணுங்க, CIBIL தானா ஏறும்!', phoneticColloquialSlang: 'Card usage 30 percent-kku ulle vachukonga!', dialectLabel: 'பேச்சுத் தமிழ்', metadata: { quickActions: [{ label: 'தகுதி பார்', actionType: 'open_eligibility' }] } },
      gov: { text: 'அரசு / PSU ஊழியர்களுக்கு 0.25% வட்டி சலுகை மற்றும் 65% FOIR வரம்பு கிடைக்கும்.', vernacularNativeSlang: 'கவர்மெண்ட் வேலைன்னா SBI-ல பிராசஸிங் ஃபீஸ் கிடையாது, வட்டியும் கம்மி!', phoneticColloquialSlang: 'Government employees-kku SBI-la zero processing fee!', dialectLabel: 'பேச்சுத் தமிழ்', metadata: { quickActions: [{ label: 'தகுதி பார்', actionType: 'open_eligibility' }] } },
      freelancer: { text: 'ஃப்ரீலான்சர்கள் 44ADA ITR மற்றும் 12 மாத வங்கி அறிக்கை மூலம் கடன் பெறலாம்.', vernacularNativeSlang: 'ஃப்ரீலான்சரா இருந்தா 44ADA ITR போட்டு காட்டுங்க, ஈஸியா லோன் வாங்கிடலாம்!', phoneticColloquialSlang: 'Freelancers 44ADA ITR vachu easy-aa loan vaangalam!', dialectLabel: 'பேச்சுத் தமிழ்', metadata: { quickActions: [{ label: 'ஆவணங்கள்', actionType: 'open_checklist' }] } },
      retired: { text: 'ஓய்வூதியதாரர்கள் PPO நகல் மூலம் SBI பென்ஷன் கடன் பெறலாம்.', vernacularNativeSlang: 'பென்ஷனர்ஸ் PPO காப்பி குடுத்து SBI-ல கம்மி வட்டியில லோன் வாங்கிக்கலாம்.', phoneticColloquialSlang: 'Pensioners PPO copy vachu SBI-la loan vaangalam.', dialectLabel: 'பேச்சுத் தமிழ்', metadata: { quickActions: [{ label: 'ஆவணங்கள்', actionType: 'open_checklist' }] } },
      homemaker: { text: 'வீட்டுக் கடனில் பெண்களை இணை விண்ணப்பதாரராகச் சேர்த்தால் வட்டி சலுகை கிடைக்கும்.', vernacularNativeSlang: 'ஹோம் லோன்ல லேடீஸ் பேர சேர்த்தா வட்டியும் குறையும், பத்திரச் செலவும் மிச்சமாகும்!', phoneticColloquialSlang: 'Home loan-la ladies co-applicant serthaa vatti kuraiyum!', dialectLabel: 'பேச்சுத் தமிழ்', metadata: { quickActions: [{ label: 'ஆவணங்கள்', actionType: 'open_checklist', payload: { category: 'home' } }] } },
      general: { text: 'உங்கள் வருமானம் மற்றும் கடன் வகையைக் கூறுங்கள்.', vernacularNativeSlang: 'உங்க மாச வருமானம் என்ன, எந்த லோன் வேணும்னு சொல்லுங்க—இப்பவே கணக்கு போட்டுத் தர்றேன்!', phoneticColloquialSlang: 'Unga maasa varumaanam enna, endha loan venum-nu sollunga!', dialectLabel: 'பேச்சுத் தமிழ்', metadata: { quickActions: [{ label: 'தகுதி பார்', actionType: 'open_eligibility' }, { label: 'EMI கணக்கு', actionType: 'open_emi' }] } },
    },

    te: {
      welcome: {
        text: 'నమస్కారం! మీ నెలవారీ ఆదాయం, CIBIL స్కోర్ లేదా రుణం అవసరాన్ని అడగండి—తెలుగులో స్పష్టంగా వివరిస్తాను.',
        vernacularNativeSlang: 'నమస్కారం బాస్! చెప్పండి, ఏ లోన్ చూస్తున్నారు—ఇల్లు, కారు, పర్సనల్ లేదా బిజినెస్? తక్కువ వడ్డీకి ఏ బ్యాంక్ బెస్టో సూపర్ గా చెప్పేస్తాను.',
        phoneticColloquialSlang: 'Namaskaram boss! Ye loan chustunnaru—illu, car, personal leda business? Takkuva vaddiki ye bank best-o cheppestanu.',
        dialectLabel: 'వాడుక తెలుగు (Telugu Colloquial)',
      },
      home: {
        text: '760 CIBIL తో ₹45 లక్షల హోమ్ లోన్:\n• తక్కువ వడ్డీ: SBI & Bank of Baroda (8.35%–8.40%), సున్నా ప్రీపేమెంట్ చార్జీలు.\n• వేగం: HDFC 48–72 గంటల్లో ఆమోదం.',
        vernacularNativeSlang: 'బాస్, 760 CIBIL అదిరిపోయింది! డైరెక్ట్‌గా SBI లేదా బ్యాంక్ ఆఫ్ బరోడాకి వెళ్ళండి—8.35 నుంచి 8.40 పర్సెంట్‌కి వస్తుంది, ప్రీపేమెంట్ ఫీజు కూడా ఉండదు. రెండు రోజుల్లో అర్జెంట్‌గా కావాలంటే HDFC బెస్ట్!',
        phoneticColloquialSlang: 'Boss, 760 CIBIL super undi! SBI leda BOB ki vellandi, 8.35 percent ki vastundi, zero prepayment fee!',
        dialectLabel: 'వాడుక తెలుగు (Telugu Colloquial)',
        metadata: {
          estimatedAmount: 4500000,
          recommendedRate: '8.35% p.a.',
          quickActions: [
            { label: '₹45L EMI చూడండి', actionType: 'open_emi', payload: { amount: 4500000, rate: 8.4, tenure: 20 } },
            { label: 'బ్యాంక్ పోలిక', actionType: 'open_compare' },
          ],
        },
      },
      personal: {
        text: '₹55,000–₹60,000 జీతంపై 5 ఏళ్లలో ₹10–₹12.5 లక్షల పర్సనల్ లోన్ పొందవచ్చు.',
        vernacularNativeSlang: '55 వేల జీతం ఉంటే ఈజీగా 10 నుంచి 12 లక్షల పర్సనల్ లోన్ వస్తుంది బాస్! ముందు మీ శాలరీ అకౌంట్ బ్యాంక్ లో అడగండి, గంటల్లో డబ్బు వస్తుంది.',
        phoneticColloquialSlang: '55 vela jeetam unte easy-gaa 10 to 12 lakh personal loan vastundi! Mundu salary bank lo adagandi.',
        dialectLabel: 'వాడుక తెలుగు (Telugu Colloquial)',
        metadata: { estimatedAmount: 1100000, recommendedRate: '10.65% p.a.', quickActions: [{ label: 'అర్హత చూడండి', actionType: 'open_eligibility', payload: { category: 'personal' } }] },
      },
      vehicle: {
        text: 'కొత్త కారుపై 8.75% మరియు EV వాహనాలపై 8.50% నుండి రుణం లభిస్తుంది.',
        vernacularNativeSlang: 'కొత్త కారు కొంటున్నారా? ఎలక్ట్రిక్ కారు తీసుకుంటే బ్యాంకు ఇంకా తక్కువ వడ్డీకి ఇస్తుంది, 5 ఏళ్ల లోపు టెన్యూర్ పెట్టుకోండి.',
        phoneticColloquialSlang: 'Kotta car kontunnara? EV teeskunte inka takkuva vaddi vastundi!',
        dialectLabel: 'వాడుక తెలుగు (Telugu Colloquial)',
        metadata: { estimatedAmount: 1200000, recommendedRate: '8.75% p.a.', quickActions: [{ label: 'వాహన EMI', actionType: 'open_emi', payload: { amount: 1200000, rate: 8.75, tenure: 5 } }] },
      },
      education: {
        text: 'విద్యా రుణంలో కోర్సు + 12 నెలల మారటోరియం మరియు Sec 80E పన్ను మినహాయింపు లభిస్తుంది.',
        vernacularNativeSlang: 'చదువు కోసం లోన్ తీసుకుంటే కోర్సు అయిపోయాక ఒక ఏడాది వరకు ఒక్క రూపాయి కూడా కట్టక్కర్లేదు, వడ్డీపై ఫుల్ ట్యాక్స్ సేవింగ్ కూడా ఉంటుంది!',
        phoneticColloquialSlang: 'Education loan lo course ayipoyaka 1 year varaku EMI kattakkarledu!',
        dialectLabel: 'వాడుక తెలుగు (Telugu Colloquial)',
        metadata: { estimatedAmount: 2500000, recommendedRate: '8.50% p.a.', quickActions: [{ label: 'పత్రాలు చూడండి', actionType: 'open_checklist', payload: { category: 'education' } }] },
      },
      business: {
        text: 'ముద్ర మరియు CGTMSE ద్వారా ₹2 కోట్ల వరకు పూచీకత్తు లేకుండా వ్యాపార రుణం.',
        vernacularNativeSlang: 'బిజినెస్ పెంచుకోవడానికి ఆస్తి తాకట్టు పెట్టనక్కర్లేదు—CGTMSE ముద్ర స్కీమ్ లో గ్యారెంటీ లేకుండా లోన్ వస్తుంది, GST సరిగ్గా ఫైల్ చేయండి చాలు!',
        phoneticColloquialSlang: 'Business ki CGTMSE Mudra scheme lo guarantee lekunda loan vastundi!',
        dialectLabel: 'వాడుక తెలుగు (Telugu Colloquial)',
        metadata: { estimatedAmount: 2500000, recommendedRate: '9.50% p.a.', quickActions: [{ label: 'MSME పత్రాలు', actionType: 'open_checklist', payload: { category: 'business' } }] },
      },
      agriculture: {
        text: 'కిసాన్ క్రెడిట్ కార్డ్ (KCC): 7% వడ్డీ; ఏడాదిలోపు చెల్లిస్తే 3% రాయితీతో కేవలం 4% వడ్డీ మాత్రమే!',
        vernacularNativeSlang: 'రైతు సోదరులకు అదిరిపోయే విషయం: KCC లో 7 పర్సెంట్ వడ్డీ అయినా, ఏడాదిలోపు కరెక్ట్‌గా కట్టేస్తే 3 పర్సెంట్ సబ్సిడీ వెనక్కి వస్తుంది—అంటే వడ్డీ కేవలం 4 పర్సెంట్ మాత్రమే!',
        phoneticColloquialSlang: 'KCC lo samvatsaram lopu katteste 3 percent subsidy vachi kevalam 4 percent vaddi matrame!',
        dialectLabel: 'గ్రామీణ తెలుగు (Telugu Rural)',
        metadata: { estimatedAmount: 300000, recommendedRate: '4.00% p.a.', quickActions: [{ label: '4% EMI చూడండి', actionType: 'open_emi', payload: { amount: 300000, rate: 4.0, tenure: 3 } }] },
      },
      compare: {
        text: 'SBI అతి తక్కువ వడ్డీకి (8.40%), HDFC 48 గంటల వేగవంతమైన ఆమోదానికి ఉత్తమం.',
        vernacularNativeSlang: 'డబ్బు ఆదా చేసుకోవాలంటే SBI బెస్ట్, రెండు రోజుల్లో ఫాస్ట్‌గా లోన్ కావాలంటే HDFC సూపర్!',
        phoneticColloquialSlang: 'Dabbu save cheyalante SBI best, fast gaa kavalante HDFC super!',
        dialectLabel: 'వాడుక తెలుగు (Telugu Colloquial)',
        metadata: { quickActions: [{ label: 'బ్యాంక్ పోలిక', actionType: 'open_compare' }] },
      },
      cibil: { text: 'క్రెడిట్ కార్డ్ వాడకాన్ని 30% లోపు ఉంచి CIBIL పెంచుకోండి.', vernacularNativeSlang: 'కార్డ్ లిమిట్ 30 పర్సెంట్ లోపే వాడండి, CIBIL స్కోర్ ఫాస్ట్‌గా పెరుగుతుంది!', phoneticColloquialSlang: 'Card limit 30 percent lope vaadandi!', dialectLabel: 'వాడుక తెలుగు', metadata: { quickActions: [{ label: 'అర్హత చూడండి', actionType: 'open_eligibility' }] } },
      gov: { text: 'ప్రభుత్వ / PSU ఉద్యోగులకు 0.25% వడ్డీ రాయితీ మరియు 65% FOIR పరిమితి లభిస్తుంది.', vernacularNativeSlang: 'గవర్నమెంట్ ఉద్యోగులకు SBI లో ప్రాసెసింగ్ ఫీజు ఉండదు, వడ్డీ కూడా తక్కువ!', phoneticColloquialSlang: 'Government employees ki SBI lo zero processing fee!', dialectLabel: 'వాడుక తెలుగు', metadata: { quickActions: [{ label: 'అర్హత చూడండి', actionType: 'open_eligibility' }] } },
      freelancer: { text: 'ఫ్రీలాన్సర్లు 44ADA ITR మరియు 12 నెలల బ్యాంక్ స్టేట్‌మెంట్ ద్వారా లోన్ పొందవచ్చు.', vernacularNativeSlang: 'ఫ్రీలాన్సర్స్ 44ADA ITR చూపించి ఈజీగా లోన్ తెచ్చుకోవచ్చు!', phoneticColloquialSlang: 'Freelancers 44ADA ITR tho easy-gaa loan teeskovachu!', dialectLabel: 'వాడుక తెలుగు', metadata: { quickActions: [{ label: 'పత్రాలు', actionType: 'open_checklist' }] } },
      retired: { text: 'పెన్షనర్లు PPO కాపీ ద్వారా SBI పెన్షన్ లోన్ పొందవచ్చు.', vernacularNativeSlang: 'పెన్షనర్లు PPO కాపీతో SBI లో తక్కువ వడ్డీకి లోన్ తీసుకోవచ్చు.', phoneticColloquialSlang: 'Pensioners PPO copy tho SBI lo loan teeskovachu.', dialectLabel: 'వాడుక తెలుగు', metadata: { quickActions: [{ label: 'పత్రాలు', actionType: 'open_checklist' }] } },
      homemaker: { text: 'హోమ్ లోన్‌లో మహిళా సహ-దరఖాస్తుదారుని చేర్చడం వల్ల వడ్డీ మరియు స్టాంప్ డ్యూటీ ఆదా అవుతాయి.', vernacularNativeSlang: 'హోమ్ లోన్‌లో ఆడవాళ్ళ పేరు జతచేస్తే వడ్డీతో పాటు రిజిస్ట్రేషన్ ఖర్చు కూడా తగ్గుతుంది!', phoneticColloquialSlang: 'Home loan lo women co-applicant add chesthe vaddi taggutundi!', dialectLabel: 'వాడుక తెలుగు', metadata: { quickActions: [{ label: 'పత్రాలు', actionType: 'open_checklist', payload: { category: 'home' } }] } },
      general: { text: 'మీ నెలవారీ ఆదాయం మరియు రుణం రకం చెప్పండి.', vernacularNativeSlang: 'మీ నెల జీతం ఎంత, ఏ లోన్ కావాలో చెప్పండి—ఇప్పుడే పూర్తి లెక్క చెప్పేస్తాను!', phoneticColloquialSlang: 'Mee nela jeetam entha, ye loan kavalo cheppandi!', dialectLabel: 'వాడుక తెలుగు', metadata: { quickActions: [{ label: 'అర్హత చూడండి', actionType: 'open_eligibility' }, { label: 'EMI చూడండి', actionType: 'open_emi' }] } },
    },
  };

  const langBundle = responsesByLang[lang] || responsesByLang.en!;
  return langBundle[intent] || langBundle.general;
};
