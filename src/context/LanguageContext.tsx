import React, { createContext, useContext, useState, useEffect } from 'react';
import { speechVoice, RegionalLanguage } from '../utils/speechVoice';
import { audioChime } from '../utils/audioChime';

export type LanguageCode = 'en' | 'hi' | 'pa' | 'mr' | 'gu' | 'te';

export interface LanguageInfo {
  code: LanguageCode;
  name: string;
  nativeName: string;
  script: string;
  speechLocale: RegionalLanguage;
  region: string;
  flag: string;
  greeting: string;
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    script: 'Latin',
    speechLocale: 'en-IN',
    region: 'Pan-India Official',
    flag: '🇮🇳',
    greeting: 'Welcome to KrishiSetu Mandi Portal.'
  },
  {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    script: 'Devanagari',
    speechLocale: 'hi-IN',
    region: 'Haryana, MP, UP, Rajasthan, Bihar',
    flag: '🇮🇳',
    greeting: 'नमस्ते! कृषि सेतु मंडी पोर्टल में आपका स्वागत है।'
  },
  {
    code: 'pa',
    name: 'Punjabi',
    nativeName: 'ਪੰਜਾਬੀ',
    script: 'Gurmukhi',
    speechLocale: 'pa-IN',
    region: 'Punjab, Haryana (Karnal, Khanna)',
    flag: '🌾',
    greeting: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਕ੍ਰਿਸ਼ੀ ਸੇਤੂ ਮੰਡੀ ਪੋਰਟਲ ਤੇ ਤੁਹਾਡਾ ਸਵਾਗਤ ਹੈ।'
  },
  {
    code: 'mr',
    name: 'Marathi',
    nativeName: 'मराठी',
    script: 'Devanagari',
    speechLocale: 'mr-IN',
    region: 'Maharashtra (Pune, Nashik, Latur)',
    flag: '🌱',
    greeting: 'नमस्कार! कृषी सेतू मंडी पोर्टलवर आपले स्वागत आहे.'
  },
  {
    code: 'gu',
    name: 'Gujarati',
    nativeName: 'ગુજરાતી',
    script: 'Gujarati',
    speechLocale: 'hi-IN', // fallback to hi-IN for TTS if gu-IN unavailable
    region: 'Gujarat (Rajkot, Unjha, Gondal)',
    flag: '🌼',
    greeting: 'નમસ્તે! કૃષિ સેતુ મંડી પોર્ટલ પર આપનું સ્વાગત છે.'
  },
  {
    code: 'te',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    script: 'Telugu',
    speechLocale: 'te-IN',
    region: 'Andhra Pradesh, Telangana',
    flag: '🌾',
    greeting: 'నమస్కారం! కృషి సేతు మండి పోర్టల్‌కు స్వాగతం.'
  }
];

// Dictionary of core UI translations across the application
const TRANSLATIONS: Record<LanguageCode, Record<string, string>> = {
  en: {
    // Brand & Header
    'brand.title': 'KrishiSetu',
    'brand.subtitle': 'DoCA & FCI',
    'header.login': 'Login Portal',
    'header.demoScript': 'Demo Script',
    'header.mandiSelector': 'Mandi Center',
    'header.language': 'Language',
    
    // Roles
    'role.farmer': 'Farmer',
    'role.officer': 'Procurement Officer',
    'role.transporter': 'Transporter',
    'role.buyer': 'Local Buyer',
    'role.kiosk': 'CSC Kiosk / IVR',
    'role.farmer.sub': 'Kisan Portal',
    'role.officer.sub': 'DoCA Command',
    'role.transporter.sub': 'Fleet & Dispatch',
    'role.buyer.sub': 'Secondary Market',
    'role.kiosk.sub': 'Offline Inclusivity',

    // Navigation Items
    'nav.dashboard': 'Dashboard Overview',
    'nav.voiceBooking': 'Voice Slot Booking',
    'nav.bookSlot': 'Book Procurement Slot',
    'nav.queueTracker': 'Live Queue Tracker',
    'nav.digitalPass': 'Digital QR Pass',
    'nav.dbtHistory': 'Procurement & DBT',
    'nav.commandOverview': 'Command Overview',
    'nav.aiSupplyMatcher': 'AI Supply Matcher',
    'nav.slotRedistribution': 'Slot Redistribution',
    'nav.gateLiveView': 'Gate CCTV Live View',
    'nav.analytics': 'Analytics & Traffic',
    'nav.economicImpact': 'Economic Impact',
    'nav.qrScanner': 'Gate QR Scanner',
    'nav.dailyRoster': 'Daily Queue Roster',
    'nav.gradingWeighing': 'Grading & Weighing',
    'nav.siloCapacity': 'Silo Capacity & Fleet',
    'nav.cockpit': 'Driver Cockpit',
    'nav.routeOptimizer': 'Route Optimizer',
    'nav.activeDispatches': 'Ready Dispatches',
    'nav.echallan': 'E-Challan & Sign-Off',
    'nav.marketBoard': 'Open Market Board',
    'nav.biddingDesk': 'Bidding Desk',
    'nav.kioskScanner': 'Camera QR Validator',
    'nav.paperSlip': 'Print & PDF Gate Pass',
    'nav.ivrSimulator': 'IVR Voice Simulator',

    // Common Actions
    'action.downloadPdf': 'Download PDF Pass',
    'action.printHardCopy': 'Print Hard Copy',
    'action.reroute': 'Re-Route Vehicles',
    'action.admit': 'Admit Vehicle',
    'action.callChime': 'Ring Gate Chime',
    'action.live': 'LIVE',
    'action.auto': 'Auto-Pilot',
    'action.save': 'Save',
    'action.close': 'Close'
  },
  hi: {
    // Brand & Header
    'brand.title': 'कृषि सेतु',
    'brand.subtitle': 'उपभोक्ता मामले व एफसीआई',
    'header.login': 'लॉगिन पोर्टल',
    'header.demoScript': 'डेमो स्क्रिप्ट',
    'header.mandiSelector': 'मंडी केंद्र',
    'header.language': 'भाषा (Language)',

    // Roles
    'role.farmer': 'किसान',
    'role.officer': 'खरीद अधिकारी',
    'role.transporter': 'परिवहन (ट्रक)',
    'role.buyer': 'स्थानीय व्यापारी',
    'role.kiosk': 'सीएससी कियोस्क / आईवीआर',
    'role.farmer.sub': 'किसान पोर्टल',
    'role.officer.sub': 'कमांड सेंटर',
    'role.transporter.sub': 'वाहन व डिस्पेच',
    'role.buyer.sub': 'खुली मंडी नीलामी',
    'role.kiosk.sub': 'ऑफ़लाइन किसान सुविधा',

    // Navigation Items
    'nav.dashboard': 'डैशबोर्ड अवलोकन',
    'nav.voiceBooking': 'आवाज़ से स्लॉट बुकिंग',
    'nav.bookSlot': 'उपज स्लॉट बुक करें',
    'nav.queueTracker': 'लाइव कतार ट्रैकर',
    'nav.digitalPass': 'डिजिटल क्यूआर पास',
    'nav.dbtHistory': 'उपज भुगतान व डीबीटी',
    'nav.commandOverview': 'मंडी कमांड अवलोकन',
    'nav.aiSupplyMatcher': 'एआई स्थानीय खरीदार मिलान',
    'nav.slotRedistribution': 'गेट स्लॉट पुनर्वितरण',
    'nav.gateLiveView': 'गेट लाइव सीसीटीवी',
    'nav.analytics': 'आंकड़े व मंडी ट्रैफिक',
    'nav.economicImpact': 'आर्थिक लाभ व बचत',
    'nav.qrScanner': 'गेट क्यूआर स्कैनर',
    'nav.dailyRoster': 'दैनिक वाहन रोस्टर',
    'nav.gradingWeighing': 'ग्रेडिंग व वजन कांटा',
    'nav.siloCapacity': 'साइलो भंडारण व फ्लीट',
    'nav.cockpit': 'चालक कॉकपिट',
    'nav.routeOptimizer': 'गेट ट्रैफिक रूट प्लानर',
    'nav.activeDispatches': 'तैयार डिस्पेच चालान',
    'nav.echallan': 'ई-चालान व हस्ताक्षर',
    'nav.marketBoard': 'खुला बाजार बोर्ड',
    'nav.biddingDesk': 'व्यापारी बोली पटल',
    'nav.kioskScanner': 'कियोस्क कैमरा स्कैनर',
    'nav.paperSlip': 'प्रिंट व पीडीएफ पास',
    'nav.ivrSimulator': '1800 आईवीआर फोन',

    // Common Actions
    'action.downloadPdf': 'पीडीएफ पास डाउनलोड करें',
    'action.printHardCopy': 'हार्ड कॉपी प्रिंट करें',
    'action.reroute': 'वाहन पुनर्निर्देशित करें',
    'action.admit': 'वाहन को प्रवेश दें',
    'action.callChime': 'गेट घंटी बजाएं',
    'action.live': 'लाइव',
    'action.auto': 'स्वचालित',
    'action.save': 'सहेजें',
    'action.close': 'बंद करें'
  },
  pa: {
    // Brand & Header
    'brand.title': 'ਕ੍ਰਿਸ਼ੀ ਸੇਤੂ',
    'brand.subtitle': 'ਡੀਓਸੀਏ ਤੇ ਐੱਫਸੀਆਈ',
    'header.login': 'ਲਾਗਇਨ ਪੋਰਟਲ',
    'header.demoScript': 'ਡੈਮੋ ਸਕ੍ਰਿਪਟ',
    'header.mandiSelector': 'ਮੰਡੀ ਕੇਂਦਰ',
    'header.language': 'ਭਾਸ਼ਾ (Language)',

    // Roles
    'role.farmer': 'ਕਿਸਾਨ',
    'role.officer': 'ਖਰੀਦ ਅਫਸਰ',
    'role.transporter': 'ਟਰਾਂਸਪੋਰਟਰ',
    'role.buyer': 'ਸਥਾਨਕ ਵਪਾਰੀ',
    'role.kiosk': 'ਸੀਐਸਸੀ ਕਿਓਸਕ / ਆਈਵੀਆਰ',
    'role.farmer.sub': 'ਕਿਸਾਨ ਪੋਰਟਲ',
    'role.officer.sub': 'ਕਮਾਂਡ ਡੈਸਕ',
    'role.transporter.sub': 'ਟਰੱਕ ਤੇ ਲੌਜਿਸਟਿਕਸ',
    'role.buyer.sub': 'ਖੁੱਲ੍ਹੀ ਮੰਡੀ',
    'role.kiosk.sub': 'ਸਹੂਲਤ ਕੇਂਦਰ',

    // Navigation Items
    'nav.dashboard': 'ਡੈਸ਼ਬੋਰਡ',
    'nav.voiceBooking': 'ਬੋਲ ਕੇ ਸਲਾਟ ਬੁਕਿੰਗ',
    'nav.bookSlot': 'ਖਰੀਦ ਸਲਾਟ ਬੁੱਕ ਕਰੋ',
    'nav.queueTracker': 'ਲਾਈਵ ਕਤਾਰ ਟਰੈਕਰ',
    'nav.digitalPass': 'ਡਿਜੀਟਲ ਕਿਊਆਰ ਪਾਸ',
    'nav.dbtHistory': 'ਭੁਗਤਾਨ ਤੇ ਡੀਬੀਟੀ',
    'nav.commandOverview': 'ਕਮਾਂਡ ਓਵਰਵਿਊ',
    'nav.aiSupplyMatcher': 'ਏਆਈ ਸਪਲਾਈ ਮੈਚਰ',
    'nav.slotRedistribution': 'ਗੇਟ ਸਲਾਟ ਬੈਲੇਂਸ',
    'nav.gateLiveView': 'ਗੇਟ ਲਾਈਵ ਕੈਮਰਾ',
    'nav.analytics': 'ਮੰਡੀ ਟ੍ਰੈਫਿਕ ਅੰਕੜੇ',
    'nav.economicImpact': 'ਬਚਤ ਤੇ ਆਰਥਿਕ ਲਾਭ',
    'nav.qrScanner': 'ਗੇਟ ਕਿਊਆਰ ਸਕੈਨਰ',
    'nav.dailyRoster': 'ਰੋਜ਼ਾਨਾ ਕਤਾਰ ਰੋਸਟਰ',
    'nav.gradingWeighing': 'ਗੁਣਵੱਤਾ ਤੇ ਤੋਲ ਕੰਡਾ',
    'nav.siloCapacity': 'ਸਾਈਲੋ ਸਮਰੱਥਾ',
    'nav.cockpit': 'ਡਰਾਈਵਰ ਕਾਕਪਿਟ',
    'nav.routeOptimizer': 'ਰੂਟ ਆਪਟੀਮਾਈਜ਼ਰ',
    'nav.activeDispatches': 'ਤਿਆਰ ਡਿਸਪੈਚ',
    'nav.echallan': 'ਈ-ਚਲਾਨ',
    'nav.marketBoard': 'ਖੁੱਲ੍ਹੀ ਮੰਡੀ ਬੋਰਡ',
    'nav.biddingDesk': 'ਬੋਲੀ ਡੈਸਕ',
    'nav.kioskScanner': 'ਕੈਮਰਾ ਸਕੈਨਰ',
    'nav.paperSlip': 'ਪੀਡੀਐਫ ਪਰਚੀ ਡਾਊਨਲੋਡ',
    'nav.ivrSimulator': 'ਆਈਵੀਆਰ ਫੋਨ',

    // Common Actions
    'action.downloadPdf': 'ਪੀਡੀਐਫ ਡਾਊਨਲੋਡ ਕਰੋ',
    'action.printHardCopy': 'ਪਰਚੀ ਪ੍ਰਿੰਟ ਕਰੋ',
    'action.reroute': 'ਗੇਟ ਬਦਲੋ',
    'action.admit': 'ਅੰਦਰ ਆਉਣ ਦਿਓ',
    'action.callChime': 'ਘੰਟੀ ਵਜਾਓ',
    'action.live': 'ਲਾਈਵ',
    'action.auto': 'ਆਟੋ',
    'action.save': 'ਸੰਭਾਲੋ',
    'action.close': 'ਬੰਦ ਕਰੋ'
  },
  mr: {
    // Brand & Header
    'brand.title': 'कृषी सेतू',
    'brand.subtitle': 'ग्राहक व्यवहार आणि एफसीआय',
    'header.login': 'लॉगिन पोर्टल',
    'header.demoScript': 'डेमो स्क्रिप्ट',
    'header.mandiSelector': 'बाजार समिती',
    'header.language': 'भाषा',

    // Roles
    'role.farmer': 'शेतकरी',
    'role.officer': 'खरेदी अधिकारी',
    'role.transporter': 'वाहतूकदार',
    'role.buyer': 'स्थानिक व्यापारी',
    'role.kiosk': 'सीएससी केंद्र / आयव्हीआर',
    'role.farmer.sub': 'शेतकरी पोर्टल',
    'role.officer.sub': 'नियंत्रण कक्ष',
    'role.transporter.sub': 'वाहतूक व्यवस्थापन',
    'role.buyer.sub': 'दुय्यम बाजार',
    'role.kiosk.sub': 'ऑफलाइन सुविधा',

    // Navigation Items
    'nav.dashboard': 'डॅशबोर्ड सारांश',
    'nav.voiceBooking': 'व्हॉइस स्लॉट बुकिंग',
    'nav.bookSlot': 'स्लॉट बुक करा',
    'nav.queueTracker': 'थेट रांग ट्रॅकर',
    'nav.digitalPass': 'डिजिटल क्यूआर पास',
    'nav.dbtHistory': 'खरेदी आणि डीबीटी जमा',
    'nav.commandOverview': 'कमांड विहंगावलोकन',
    'nav.aiSupplyMatcher': 'एआय पुरवठा जुळणी',
    'nav.slotRedistribution': 'गेट स्लॉट फेरबदल',
    'nav.gateLiveView': 'गेट थेट कॅमेरा',
    'nav.analytics': 'वाहतूक आकडेवारी',
    'nav.economicImpact': 'आर्थिक नफा व बचत',
    'nav.qrScanner': 'गेट क्यूआर स्कॅनर',
    'nav.dailyRoster': 'दैनिक रांग यादी',
    'nav.gradingWeighing': 'प्रतवारी आणि वजन',
    'nav.siloCapacity': 'सायलो साठवणूक',
    'nav.cockpit': 'चालक कक्ष',
    'nav.routeOptimizer': 'मार्ग नियोजन',
    'nav.activeDispatches': 'सज्ज वाहतूक',
    'nav.echallan': 'ई-चलन पावती',
    'nav.marketBoard': 'खुला बाजार फलक',
    'nav.biddingDesk': 'लिलाव डेस्क',
    'nav.kioskScanner': 'कॅमेरा स्कॅनर',
    'nav.paperSlip': 'पीडीएफ पावती डाउनलोड',
    'nav.ivrSimulator': 'आयव्हीआर फोन',

    // Common Actions
    'action.downloadPdf': 'पीडीएफ डाउनलोड करा',
    'action.printHardCopy': 'पावती प्रिंट करा',
    'action.reroute': 'गेट बदला',
    'action.admit': 'प्रवेश द्या',
    'action.callChime': 'घंटा वाजवा',
    'action.live': 'थेट',
    'action.auto': 'स्वयंचलित',
    'action.save': 'जतन करा',
    'action.close': 'बंद करा'
  },
  gu: {
    // Brand & Header
    'brand.title': 'કૃષિ સેતુ',
    'brand.subtitle': 'ગ્રાહક બાબતો અને એફસીઆઈ',
    'header.login': 'લૉગિન પોર્ટલ',
    'header.demoScript': 'ડેમો સ્ક્રિપ્ટ',
    'header.mandiSelector': 'મંડી કેન્દ્ર',
    'header.language': 'ભાષા',

    // Roles
    'role.farmer': 'ખેડૂત',
    'role.officer': 'ખરીદ અધિકારી',
    'role.transporter': 'વાહન પરિવહન',
    'role.buyer': 'સ્થાનિક વેપારી',
    'role.kiosk': 'સીએસસી કિઓસ્ક / આઈવીઆર',
    'role.farmer.sub': 'ખેડૂત પોર્ટલ',
    'role.officer.sub': 'કમાન્ડ સેન્ટર',
    'role.transporter.sub': 'ટ્રક મેનેજમેન્ટ',
    'role.buyer.sub': 'ખુલ્લી બજાર હરાજી',
    'role.kiosk.sub': 'ઑફલાઇન સેવા',

    // Navigation Items
    'nav.dashboard': 'ડેશબોર્ડ ઝાંખી',
    'nav.voiceBooking': 'અવાજથી સ્લોટ બુકિંગ',
    'nav.bookSlot': 'સ્લોટ બુક કરો',
    'nav.queueTracker': 'લાઈવ કતાર ટ્રેકર',
    'nav.digitalPass': 'ડિજિટલ ક્યુઆર પાસ',
    'nav.dbtHistory': 'ડીબીટી ચુકવણી',
    'nav.commandOverview': 'કમાન્ડ ઓવરવ્યૂ',
    'nav.aiSupplyMatcher': 'એઆઈ સપ્લાય મેચર',
    'nav.slotRedistribution': 'ગેટ સ્લોટ પુનર્વિતરણ',
    'nav.gateLiveView': 'ગેટ લાઈવ કેમેરા',
    'nav.analytics': 'ટ્રાફિક વિશ્લેષણ',
    'nav.economicImpact': 'આર્થિક બચત',
    'nav.qrScanner': 'ગેટ ક્યુઆર સ્કેનર',
    'nav.dailyRoster': 'દૈનિક કતાર યાદી',
    'nav.gradingWeighing': 'ગુણવત્તા અને તોલ',
    'nav.siloCapacity': 'સાયલો સંગ્રહ',
    'nav.cockpit': 'ડ્રાઇવર કોકપિટ',
    'nav.routeOptimizer': 'રૂટ પ્લાનર',
    'nav.activeDispatches': 'ડિસ્પેચ યાદી',
    'nav.echallan': 'ઈ-ચલણ',
    'nav.marketBoard': 'બજાર બોર્ડ',
    'nav.biddingDesk': 'હરાજી ડેસ્ક',
    'nav.kioskScanner': 'કેમેરા સ્કેનર',
    'nav.paperSlip': 'પીડીએફ પાસ ડાઉનલોડ',
    'nav.ivrSimulator': 'આઈવીઆર ફોન',

    // Common Actions
    'action.downloadPdf': 'પીડીએફ ડાઉનલોડ',
    'action.printHardCopy': 'પ્રિન્ટ સ્લિપ',
    'action.reroute': 'ગેટ બદલો',
    'action.admit': 'પ્રવેશ આપો',
    'action.callChime': 'ઘંટ વગાડો',
    'action.live': 'લાઈવ',
    'action.auto': 'ઓટો',
    'action.save': 'સાચવો',
    'action.close': 'બંધ કરો'
  },
  te: {
    // Brand & Header
    'brand.title': 'కృషి సేతు',
    'brand.subtitle': 'వినియోగదారుల వ్యవహారాలు & ఎఫ్‌సిఐ',
    'header.login': 'లాగిన్ పోర్టల్',
    'header.demoScript': 'డెమో స్క్రిప్ట్',
    'header.mandiSelector': 'మార్కెట్ యార్డ్',
    'header.language': 'భాష',

    // Roles
    'role.farmer': 'రైతు',
    'role.officer': 'కొనుగోలు అధికారి',
    'role.transporter': 'రవాణాదారు',
    'role.buyer': 'స్థానిక వ్యాపారి',
    'role.kiosk': 'CSC కియోస్క్ / IVR',
    'role.farmer.sub': 'రైతు పోర్టల్',
    'role.officer.sub': 'కమాండ్ డెస్క్',
    'role.transporter.sub': 'లారీ & డిస్పాచ్',
    'role.buyer.sub': 'ఓపెన్ మార్కెట్',
    'role.kiosk.sub': 'ఆఫ్‌లైన్ సేవలు',

    // Navigation Items
    'nav.dashboard': 'డాష్‌బోర్డ్ అవలోకనం',
    'nav.voiceBooking': 'వాయిస్ స్లాట్ బుకింగ్',
    'nav.bookSlot': 'స్లాట్ బుక్ చేసుకోండి',
    'nav.queueTracker': 'లైవ్ క్యూ ట్రాకర్',
    'nav.digitalPass': 'డిజిటల్ క్యూఆర్ పాస్',
    'nav.dbtHistory': 'చెల్లింపులు & DBT',
    'nav.commandOverview': 'కమాండ్ అవలోకనం',
    'nav.aiSupplyMatcher': 'AI సప్లై మ్యాచర్',
    'nav.slotRedistribution': 'గేట్ స్లాట్ మార్పు',
    'nav.gateLiveView': 'లైవ్ సీసీటీవీ కెమెరా',
    'nav.analytics': 'ట్రాఫిక్ గణాంకాలు',
    'nav.economicImpact': 'ఆర్థిక పొదుపు & లాభం',
    'nav.qrScanner': 'గేట్ క్యూఆర్ స్కానర్',
    'nav.dailyRoster': 'రోజువారీ క్యూ రోస్టర్',
    'nav.gradingWeighing': 'గ్రేడింగ్ & వేబ్రిడ్జ్',
    'nav.siloCapacity': 'సైలో నిల్వ సామర్థ్యం',
    'nav.cockpit': 'డ్రైవర్ కాక్‌పిట్',
    'nav.routeOptimizer': 'రూట్ ఆప్టిమైజర్',
    'nav.activeDispatches': 'డిస్పాచ్ జాబితా',
    'nav.echallan': 'ఇ-చలాన్',
    'nav.marketBoard': 'ఓపెన్ మార్కెట్ బోర్డ్',
    'nav.biddingDesk': 'బిడ్డింగ్ డెస్క్',
    'nav.kioskScanner': 'కెమెరా స్కానర్',
    'nav.paperSlip': 'పిడిఎఫ్ పాస్ డౌన్‌లోడ్',
    'nav.ivrSimulator': 'IVR ఫోన్',

    // Common Actions
    'action.downloadPdf': 'PDF డౌన్‌లోడ్',
    'action.printHardCopy': 'ప్రింట్ కాపీ',
    'action.reroute': 'గేట్ మార్చండి',
    'action.admit': 'అనుమతించండి',
    'action.callChime': 'గంట మోగించండి',
    'action.live': 'లైవ్',
    'action.auto': 'ఆటో',
    'action.save': 'సేవ్ చేయండి',
    'action.close': 'మూసివేయి'
  }
};

interface LanguageContextType {
  currentLanguage: LanguageCode;
  languageInfo: LanguageInfo;
  setLanguage: (lang: LanguageCode, speakAnnouncement?: boolean) => void;
  t: (key: string, fallback?: string) => string;
  supportedLanguages: LanguageInfo[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguageState] = useState<LanguageCode>('en');

  // Persist preference to localStorage if available
  useEffect(() => {
    try {
      const saved = localStorage.getItem('krishisetu_language') as LanguageCode;
      if (saved && SUPPORTED_LANGUAGES.some(l => l.code === saved)) {
        setCurrentLanguageState(saved);
      }
    } catch {
      // Ignore storage errors in restricted contexts
    }
  }, []);

  const languageInfo = SUPPORTED_LANGUAGES.find(l => l.code === currentLanguage) || SUPPORTED_LANGUAGES[0];

  const setLanguage = (lang: LanguageCode, speakAnnouncement = true) => {
    setCurrentLanguageState(lang);
    try {
      localStorage.setItem('krishisetu_language', lang);
    } catch {
      // Ignore
    }

    const info = SUPPORTED_LANGUAGES.find(l => l.code === lang);
    if (info && speakAnnouncement) {
      audioChime.playSuccessChime();
      setTimeout(() => {
        speechVoice.speak(info.greeting, info.speechLocale);
      }, 300);
    }
  };

  const t = (key: string, fallback?: string): string => {
    const dict = TRANSLATIONS[currentLanguage];
    if (dict && dict[key]) {
      return dict[key];
    }
    // Fallback to English
    const enDict = TRANSLATIONS.en;
    if (enDict && enDict[key]) {
      return enDict[key];
    }
    return fallback || key;
  };

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        languageInfo,
        setLanguage,
        t,
        supportedLanguages: SUPPORTED_LANGUAGES
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
