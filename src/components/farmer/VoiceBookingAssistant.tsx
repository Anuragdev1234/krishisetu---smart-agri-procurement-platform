import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Sparkles, 
  RotateCcw, 
  ArrowRight, 
  Calendar, 
  Clock, 
  MapPin, 
  Truck, 
  Scale, 
  Languages,
  Check,
  ShieldCheck,
  HelpCircle
} from 'lucide-react';
import { useProcurement } from '../../context/ProcurementContext';
import { SlotBooking } from '../../types/procurement';
import { speechVoice, RegionalLanguage } from '../../utils/speechVoice';
import { audioChime } from '../../utils/audioChime';

interface VoiceBookingAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (booking: SlotBooking) => void;
}

interface LanguageOption {
  code: RegionalLanguage;
  name: string;
  nativeName: string;
  welcomePrompt: string;
  samplePhrases: { text: string; label: string }[];
}

const REGIONAL_LANGUAGES: LanguageOption[] = [
  {
    code: 'hi-IN',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    welcomePrompt: 'नमस्ते! बोलकर स्लॉट बुक करें। अपनी फसल, वजन और मंडी बताएं, जैसे: "100 क्विंटल गेहूं करनाल मंडी सुबह"',
    samplePhrases: [
      { text: '100 क्विंटल गेहूं करनाल मंडी सुबह ट्रैक्टर से बुक करो', label: '🌾 100 क्विंटल गेहूं (करनाल)' },
      { text: '50 क्विंटल चना परसों सुबह इंदौर मंडी', label: '🌱 50 क्विंटल चना (इंदौर)' },
      { text: '75 क्विंटल सरसों करनाल मंडी 9 बजे', label: '🌻 75 क्विंटल सरसों (करनाल)' }
    ]
  },
  {
    code: 'pa-IN',
    name: 'Punjabi',
    nativeName: 'ਪੰਜਾਬੀ',
    welcomePrompt: 'ਸਤਿ ਸ਼੍ਰੀ ਅਕਾਲ! ਬੋਲ ਕੇ ਮੰਡੀ ਸਲਾਟ ਬੁੱਕ ਕਰੋ। ਆਪਣੀ ਫਸਲ ਅਤੇ ਵਜ਼ਨ ਦੱਸੋ, ਜਿਵੇਂ: "100 ਕੁਇੰਟਲ ਕਣਕ ਕਰਨਾਲ ਮੰਡੀ"',
    samplePhrases: [
      { text: '100 ਕੁਇੰਟਲ ਕਣਕ ਕਰਨਾਲ ਮੰਡੀ ਸਵੇਰੇ ਟਰੈਕਟਰ ਨਾਲ ਬੁੱਕ ਕਰੋ', label: '🌾 100 ਕੁਇੰਟਲ ਕਣਕ (ਕਰਨਾਲ)' },
      { text: '80 ਕੁਇੰਟਲ ਸਰ੍ਹੋਂ ਖੰਨਾ ਮੰਡੀ ਸਵੇਰੇ', label: '🌻 80 ਕੁਇੰਟਲ ਸਰ੍ਹੋਂ (ਖੰਨਾ)' }
    ]
  },
  {
    code: 'mr-IN',
    name: 'Marathi',
    nativeName: 'मराठी',
    welcomePrompt: 'नमस्कार! बोलून स्लॉट बुक करा. आपले पीक आणि वजन सांगा, जसे: "60 क्विंटल हरभरा इंदूर मंडी"',
    samplePhrases: [
      { text: '60 क्विंटल हरभरा इंदूर मंडी सकाळी ट्रॅक्टरने बुक करा', label: '🌱 60 क्विंटल हरभरा (चना)' },
      { text: '90 क्विंटल गहू करनाल मंडी सकाळी 9 वाजता', label: '🌾 90 क्विंटल गहू' }
    ]
  },
  {
    code: 'te-IN',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    welcomePrompt: 'నమస్కారం! మాట్లాడి స్లాట్ బుక్ చేయండి. మీ పంట మరియు పరిమాణం చెప్పండి, ఉదాహరణకు: "100 క్వింటాళ్ల గోధుమలు"',
    samplePhrases: [
      { text: '100 క్వింటాళ్ల గోధుమలు కర్నాల్ మండి ఉదయం ట్రాక్టర్ బుక్ చేయండి', label: '🌾 100 క్వింటాళ్ల గోధుమలు' },
      { text: '50 క్వింటాళ్ల శనగలు ఇండోర్ మండి', label: '🌱 50 క్వింటాళ్ల శనగలు' }
    ]
  },
  {
    code: 'en-IN',
    name: 'English (India)',
    nativeName: 'English',
    welcomePrompt: 'Namaste! Speak to book your slot. State your crop, weight, and center, e.g. "100 quintals Wheat at Karnal Mandi tomorrow morning"',
    samplePhrases: [
      { text: 'Book 100 quintals Wheat at Karnal Mandi morning by Tractor', label: '🌾 100 Quintals Wheat (Karnal)' },
      { text: 'Book 60 quintals Mustard at Karnal Mandi 8 30 AM', label: '🌻 60 Quintals Mustard' },
      { text: 'Book 50 quintals Gram at Indore Mandi afternoon', label: '🌱 50 Quintals Gram (Chana)' }
    ]
  }
];

export const VoiceBookingAssistant: React.FC<VoiceBookingAssistantProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { crops, centers, bookSlot, selectedCenter } = useProcurement();

  const [selectedLang, setSelectedLang] = useState<RegionalLanguage>('hi-IN');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [voiceSupported, setVoiceSupported] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Extracted booking draft state
  const [detectedCropId, setDetectedCropId] = useState<string>(crops[0]?.id || 'crop-1');
  const [detectedWeightQtl, setDetectedWeightQtl] = useState<number>(100);
  const [detectedCenterId, setDetectedCenterId] = useState<string>(selectedCenter.id || centers[0]?.id || 'center-krn');
  const [detectedDate, setDetectedDate] = useState<string>('2026-09-30');
  const [detectedTimeSlot, setDetectedTimeSlot] = useState<string>('08:30 AM - 09:30 AM');
  const [detectedVehicle, setDetectedVehicle] = useState<SlotBooking['vehicleType']>('Tractor Trolley');
  const [detectedVehicleNumber, setDetectedVehicleNumber] = useState<string>('HR 05 AB 4812');
  const [farmerName, setFarmerName] = useState<string>('Rameshwar Singh Yadav');
  const [hasParsedEntities, setHasParsedEntities] = useState<boolean>(false);
  const [isConfirmed, setIsConfirmed] = useState<boolean>(false);

  const recognitionRef = useRef<any>(null);

  const currentLangConfig = REGIONAL_LANGUAGES.find(l => l.code === selectedLang) || REGIONAL_LANGUAGES[0];
  const currentCrop = crops.find(c => c.id === detectedCropId) || crops[0];
  const chosenCenter = centers.find(c => c.id === detectedCenterId) || centers[0];
  const totalBags = Math.round(detectedWeightQtl * 2);
  const estimatedMspPayout = Math.round(detectedWeightQtl * (currentCrop?.mspRatePerQtl || 2275));

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = selectedLang;

      recognition.onstart = () => {
        setIsListening(true);
        setErrorMessage(null);
      };

      recognition.onresult = (event: any) => {
        let finalStr = '';
        let interimStr = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalStr += event.results[i][0].transcript;
          } else {
            interimStr += event.results[i][0].transcript;
          }
        }
        if (interimStr) {
          setInterimTranscript(interimStr);
        }
        if (finalStr) {
          setTranscript(finalStr);
          setInterimTranscript('');
          parseSpeechCommand(finalStr);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setErrorMessage('Microphone access blocked. You can still test with the 1-click regional voice phrases below.');
        } else if (event.error === 'no-speech') {
          setErrorMessage('No voice detected. Please speak louder or tap a quick phrase.');
        } else {
          setErrorMessage(`Voice recognition: ${event.error}. You can use sample regional phrases.`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } catch (e) {
      setVoiceSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [selectedLang]);

  // Read out greeting when modal opens or language switches
  useEffect(() => {
    if (isOpen) {
      speechVoice.speak(currentLangConfig.welcomePrompt, selectedLang);
    }
    return () => {
      speechVoice.stop();
    };
  }, [isOpen, selectedLang]);

  // Natural Language Understanding (Entity Extraction from Spoken Text)
  const parseSpeechCommand = (spokenText: string) => {
    const textLower = spokenText.toLowerCase();

    // 1. Crop Detection (Wheat, Mustard, Chana, Moong in Hindi, Punjabi, Marathi, Telugu, English)
    let foundCropId = detectedCropId;
    if (textLower.includes('gehu') || textLower.includes('गेहूं') || textLower.includes('कणक') || textLower.includes('kanak') || textLower.includes('wheat') || textLower.includes('गहू') || textLower.includes('గోధుమ')) {
      foundCropId = 'crop-1'; // Wheat
    } else if (textLower.includes('sarson') || textLower.includes('सरसों') || textLower.includes('mustard') || textLower.includes('ਸਰ੍ਹੋਂ') || textLower.includes('मोहरी') || textLower.includes('ఆవాలు')) {
      foundCropId = 'crop-2'; // Mustard
    } else if (textLower.includes('chana') || textLower.includes('चना') || textLower.includes('gram') || textLower.includes('छोले') || textLower.includes('हरभरा') || textLower.includes('శనగ')) {
      foundCropId = 'crop-3'; // Chana
    } else if (textLower.includes('moong') || textLower.includes('मूंग') || textLower.includes('green gram') || textLower.includes('मूग') || textLower.includes('పెసలు')) {
      foundCropId = 'crop-4'; // Moong
    }
    setDetectedCropId(foundCropId);

    // 2. Quantity / Weight Detection (e.g. "100 quintal", "50", "80")
    const numberMatches = textLower.match(/(\d+)\s*(quintal|qtl|कुइंटल|क्विंटल|बोरी|bags|kg|किलो|टॉन)?/i) || textLower.match(/(\d+)/);
    if (numberMatches && numberMatches[1]) {
      const parsedNum = parseInt(numberMatches[1], 10);
      if (parsedNum >= 5 && parsedNum <= 1000) {
        setDetectedWeightQtl(parsedNum);
      }
    } else if (textLower.includes('sau') || textLower.includes('सौ') || textLower.includes('ਸੌ')) {
      setDetectedWeightQtl(100);
    } else if (textLower.includes('pachaas') || textLower.includes('पचास') || textLower.includes('ਪੰਜਾਹ')) {
      setDetectedWeightQtl(50);
    }

    // 3. Center Mandi Detection
    let foundCenterId = detectedCenterId;
    if (textLower.includes('karnal') || textLower.includes('करनाल') || textLower.includes('ਕਰਨਾਲ')) {
      foundCenterId = 'center-krn';
    } else if (textLower.includes('indore') || textLower.includes('इंदौर') || textLower.includes('ਇੰਦੌਰ')) {
      foundCenterId = 'center-ind';
    } else if (textLower.includes('khanna') || textLower.includes('खन्ना') || textLower.includes('ਖੰਨਾ')) {
      foundCenterId = 'center-khn';
    }
    setDetectedCenterId(foundCenterId);

    // 4. Vehicle Type Detection
    if (textLower.includes('tractor') || textLower.includes('ट्रैक्टर') || textLower.includes('ਟਰੈਕਟਰ') || textLower.includes('ट्रॅक्टर')) {
      setDetectedVehicle('Tractor Trolley');
    } else if (textLower.includes('truck') || textLower.includes('ट्रक') || textLower.includes('ਟਰੱਕ')) {
      setDetectedVehicle('Commercial Truck');
    } else if (textLower.includes('pickup') || textLower.includes('mini truck') || textLower.includes('छोटा हाथी')) {
      setDetectedVehicle('Mini Truck');
    } else if (textLower.includes('bailgadi') || textLower.includes('बैलगाड़ी') || textLower.includes('cart')) {
      setDetectedVehicle('Bullock Cart');
    }

    // 5. Time Slot Detection
    if (textLower.includes('subah') || textLower.includes('morning') || textLower.includes('सवेरे') || textLower.includes('सकाळी') || textLower.includes('ఉదయం') || textLower.includes('8') || textLower.includes('9')) {
      setDetectedTimeSlot('08:30 AM - 09:30 AM');
    } else if (textLower.includes('dopahar') || textLower.includes('afternoon') || textLower.includes('ਦੁਪਹਿਰ') || textLower.includes('दुपारी') || textLower.includes('మధ్యాహ్నం') || textLower.includes('2')) {
      setDetectedTimeSlot('02:00 PM - 03:00 PM');
    }

    setHasParsedEntities(true);
    audioChime.playSuccessChime();

    // Voice back confirmation in chosen language
    const targetCrop = crops.find(c => c.id === foundCropId) || crops[0];
    const targetCenter = centers.find(c => c.id === foundCenterId) || centers[0];
    
    let spokenConfirmation = '';
    if (selectedLang === 'hi-IN') {
      spokenConfirmation = `${targetCrop.name} ${detectedWeightQtl} क्विंटल, ${targetCenter.name} के लिए दर्ज किया गया। पुष्टि करने के लिए कन्फर्म दबाएं।`;
    } else if (selectedLang === 'pa-IN') {
      spokenConfirmation = `${targetCrop.name} ${detectedWeightQtl} ਕੁਇੰਟਲ, ${targetCenter.name} ਲਈ ਦਰਜ ਕੀਤੀ ਗਈ ਹੈ।`;
    } else if (selectedLang === 'mr-IN') {
      spokenConfirmation = `${targetCrop.name} ${detectedWeightQtl} क्विंटल, ${targetCenter.name} साठी नोंदवले आहे.`;
    } else if (selectedLang === 'te-IN') {
      spokenConfirmation = `${targetCrop.name} ${detectedWeightQtl} క్వింటాళ్లు, ${targetCenter.name} కొరకు నమోదు చేయబడింది.`;
    } else {
      spokenConfirmation = `Recorded ${detectedWeightQtl} quintals of ${targetCrop.name} at ${targetCenter.name}. Click confirm to generate pass.`;
    }

    setTimeout(() => {
      speechVoice.speak(spokenConfirmation, selectedLang);
    }, 400);
  };

  // Toggle Live Microphone
  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setErrorMessage(null);
      try {
        if (recognitionRef.current) {
          recognitionRef.current.lang = selectedLang;
          recognitionRef.current.start();
        } else {
          // If browser speech recognition is not supported, provide polite notice
          setErrorMessage('Live microphone requires browser SpeechRecognition. Please use the 1-click regional phrases below.');
        }
      } catch (err) {
        console.warn('SpeechRecognition start err:', err);
      }
    }
  };

  // Click-to-Speak Sample Preset Phrase
  const handleSelectPreset = (phrase: string) => {
    setTranscript(phrase);
    setInterimTranscript('');
    parseSpeechCommand(phrase);
  };

  // Speak Current Summary Aloud
  const handleSpeakSummary = () => {
    const summaryText = selectedLang === 'hi-IN'
      ? `आपका ${currentCrop.name} ${detectedWeightQtl} क्विंटल, कुल ${totalBags} बोरी, ${chosenCenter.name} में 30 सितम्बर सुबह 8:30 बजे निर्धारित है। न्यूनतम समर्थन मूल्य कुल ${estimatedMspPayout} रुपये सीधे बैंक खाते में मिलेंगे।`
      : `Summary: ${detectedWeightQtl} quintals of ${currentCrop.name} at ${chosenCenter.name}. Estimated payout: ${estimatedMspPayout} rupees.`;
    speechVoice.speak(summaryText, selectedLang);
  };

  // Confirm Booking
  const handleConfirmVoiceBooking = () => {
    const booking = bookSlot({
      farmerName,
      farmerPhone: '+91 98765 43210',
      aadhaarLast4: '7184',
      cropId: currentCrop.id,
      cropName: currentCrop.name,
      estimatedWeightQtl: detectedWeightQtl,
      bagsCount: totalBags,
      centerId: chosenCenter.id,
      centerName: chosenCenter.name,
      bookingDate: detectedDate,
      timeSlot: detectedTimeSlot,
      vehicleNumber: detectedVehicleNumber,
      vehicleType: detectedVehicle,
      mspRate: currentCrop.mspRatePerQtl,
      bankAccountLast4: '4192',
      ifscCode: 'SBIN0001248'
    });

    audioChime.playGateCallChime();
    setIsConfirmed(true);

    const successMessage = selectedLang === 'hi-IN'
      ? `बधाई हो! टोकन नंबर ${booking.tokenNumber.replace(/-/g, ' ')} सफलतापूर्वक बुक हो गया है। एसएमएस आपके मोबाइल पर भेज दिया गया है।`
      : `Congratulations! Gate pass token ${booking.tokenNumber} is successfully booked.`;
    speechVoice.speak(successMessage, selectedLang);

    setTimeout(() => {
      if (onSuccess) {
        onSuccess(booking);
      }
      onClose();
    }, 2200);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border-2 border-emerald-800/30 overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-neutral-900">
        
        {/* 1. Header Banner */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-300 shadow-inner">
              <Mic className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300 uppercase tracking-wider mb-0.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Elderly & Voice Assisted Booking</span>
                <span>·</span>
                <span>बोलकर स्लॉट बुक करें</span>
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-white">
                Kisan Regional Voice Assistant
              </h2>
            </div>
          </div>

          <button
            onClick={() => {
              speechVoice.stop();
              onClose();
            }}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Regional Language Bar */}
        <div className="px-5 py-3 bg-neutral-50 border-b border-neutral-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-neutral-700">
            <Languages className="w-4 h-4 text-emerald-800" />
            <span>Select Regional Spoken Language / भाषा चुनें:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {REGIONAL_LANGUAGES.map((lang) => {
              const isSelected = selectedLang === lang.code;
              return (
                <button
                  key={lang.code}
                  onClick={() => {
                    setSelectedLang(lang.code);
                    setTranscript('');
                    setInterimTranscript('');
                  }}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs flex items-center gap-1 ${
                    isSelected
                      ? 'bg-emerald-800 text-white shadow-xs'
                      : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-100'
                  }`}
                >
                  <span>{lang.nativeName}</span>
                  <span className="text-[10px] opacity-75">({lang.name})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Central Interactive Voice Recognition Stage */}
        <div className="p-5 sm:p-6 space-y-5">
          
          {/* Big Microphone Push-to-Talk Button & Soundwave */}
          <div className="p-5 rounded-2xl bg-gradient-to-b from-neutral-50 to-emerald-50/40 border-2 border-emerald-100 text-center space-y-4">
            
            <div className="flex flex-col items-center justify-center">
              <button
                type="button"
                onClick={toggleListening}
                className={`w-24 h-24 rounded-full flex flex-col items-center justify-center transition-all shadow-xl active:scale-95 relative ${
                  isListening
                    ? 'bg-rose-600 text-white ring-8 ring-rose-400/30 shadow-rose-600/40 animate-pulse'
                    : 'bg-emerald-800 hover:bg-emerald-700 text-white ring-8 ring-emerald-500/20 shadow-emerald-800/40'
                }`}
              >
                {isListening ? (
                  <>
                    <Mic className="w-9 h-9" />
                    <span className="text-[10px] font-bold uppercase mt-1">Listening</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-9 h-9" />
                    <span className="text-[10px] font-bold uppercase mt-1">Tap to Speak</span>
                  </>
                )}
              </button>

              {/* Sound Wave Bars */}
              {isListening && (
                <div className="flex items-center gap-1 mt-3 h-6">
                  {[40, 70, 95, 60, 85, 100, 55, 75, 90, 45, 65].map((h, i) => (
                    <span
                      key={i}
                      className="w-1 bg-emerald-600 rounded-full animate-pulse"
                      style={{ 
                        height: `${h}%`,
                        animationDelay: `${i * 80}ms`
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Prompt Instruction */}
            <div>
              <p className="text-xs text-neutral-600 font-medium">
                {isListening 
                  ? 'सुन रहे हैं... बोलिए (Listening in ' + currentLangConfig.name + '...)'
                  : 'माइक दबाकर बोलें या नीचे दिए गए वाक्य पर टैप करें (Press mic or select a regional preset below)'
                }
              </p>
            </div>

            {/* Live Transcript / Detected Speech Display */}
            <div className="min-h-[52px] p-3.5 bg-white rounded-xl border border-neutral-200 text-left flex items-start justify-between gap-3 shadow-inner">
              <div className="flex-1">
                <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider block">
                  Live Spoken Text / किसान की आवाज़:
                </span>
                <p className="text-sm font-semibold text-neutral-900 mt-0.5">
                  {transcript || interimTranscript ? (
                    <span>
                      {transcript} <span className="text-emerald-600 italic">{interimTranscript}</span>
                    </span>
                  ) : (
                    <span className="text-neutral-400 italic">
                      "{currentLangConfig.welcomePrompt}"
                    </span>
                  )}
                </p>
              </div>

              {(transcript || hasParsedEntities) && (
                <button
                  type="button"
                  onClick={() => {
                    setTranscript('');
                    setInterimTranscript('');
                    setHasParsedEntities(false);
                  }}
                  className="text-xs text-neutral-400 hover:text-neutral-700 p-1"
                  title="Clear"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {errorMessage && (
              <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs flex items-center justify-between text-left">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              </div>
            )}
          </div>

          {/* 4. One-Click Regional Spoken Presets (For instant demonstration or quiet rooms) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-neutral-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Try Instant Spoken Presets ({currentLangConfig.nativeName}):</span>
              </span>
              <span className="text-[11px] text-neutral-500 font-mono">1-Click Voice Command</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {currentLangConfig.samplePhrases.map((phrase, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectPreset(phrase.text)}
                  className="p-2.5 rounded-xl border border-neutral-200 bg-neutral-50 hover:bg-emerald-50 hover:border-emerald-300 text-left transition-all group flex items-center justify-between"
                >
                  <div>
                    <span className="text-xs font-bold text-neutral-900 group-hover:text-emerald-950 block">
                      {phrase.label}
                    </span>
                    <span className="text-[11px] text-neutral-500 line-clamp-1">
                      "{phrase.text}"
                    </span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-emerald-700 shrink-0 ml-2" />
                </button>
              ))}
            </div>
          </div>

          {/* 5. Detected Extracted Reservation Card (High Contrast for Elderly Farmers) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-neutral-900 text-white space-y-3 shadow-md border border-neutral-800">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2.5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                  AI Extracted Pass Details / पहचानी गई जानकारी
                </span>
              </div>
              <button
                type="button"
                onClick={handleSpeakSummary}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-emerald-300 text-[11px] font-semibold transition-colors"
                title="Listen to summary aloud"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>बोलकर सुनाएं (Read Aloud)</span>
              </button>
            </div>

            {/* Extracted Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-xs">
              <div className="p-2.5 bg-neutral-800/90 rounded-xl">
                <span className="text-[10px] text-neutral-400 block">फसल (Crop)</span>
                <span className="font-bold text-emerald-400 text-sm">{currentCrop.name}</span>
                <span className="text-[10px] text-neutral-400 block">{currentCrop.hindiName}</span>
              </div>

              <div className="p-2.5 bg-neutral-800/90 rounded-xl">
                <span className="text-[10px] text-neutral-400 block">वजन (Quantity)</span>
                <span className="font-mono font-extrabold text-white text-sm">{detectedWeightQtl} Quintals</span>
                <span className="text-[10px] text-neutral-400 block">~{totalBags} Jute Bags</span>
              </div>

              <div className="p-2.5 bg-neutral-800/90 rounded-xl">
                <span className="text-[10px] text-neutral-400 block">मंडी केंद्र (Center)</span>
                <span className="font-bold text-white text-xs truncate block">{chosenCenter.name}</span>
                <span className="text-[10px] text-emerald-400 block">Low Queue Bay</span>
              </div>

              <div className="p-2.5 bg-neutral-800/90 rounded-xl">
                <span className="text-[10px] text-neutral-400 block">गारंटीकृत भुगतान (MSP)</span>
                <span className="font-mono font-extrabold text-emerald-400 text-sm">₹{estimatedMspPayout.toLocaleString('en-IN')}</span>
                <span className="text-[10px] text-neutral-400 block">PFMS Bank DBT</span>
              </div>
            </div>

            {/* Transport & Slot Sub-Strip */}
            <div className="flex flex-wrap items-center justify-between text-[11px] text-neutral-300 pt-2 border-t border-neutral-800">
              <div className="flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-neutral-400" />
                <span>वाहन: <strong>{detectedVehicle} ({detectedVehicleNumber})</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-neutral-400" />
                <span>तारीख व समय: <strong>{detectedDate} ({detectedTimeSlot})</strong></span>
              </div>
            </div>
          </div>

        </div>

        {/* 6. Footer Action Bar */}
        <div className="p-4 sm:p-5 bg-neutral-50 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-neutral-500 text-center sm:text-left">
            <span>बुजुर्ग किसानों के लिए 100% सुगम · आवाज़ से पूरा फॉर्म भरा जाता है</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => {
                speechVoice.stop();
                onClose();
              }}
              className="px-4 py-2.5 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-100 text-xs font-semibold text-neutral-700 transition-colors flex-1 sm:flex-initial"
            >
              रद्द करें (Cancel)
            </button>

            <button
              type="button"
              onClick={handleConfirmVoiceBooking}
              disabled={isConfirmed}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-md flex items-center justify-center gap-2 flex-1 sm:flex-initial ${
                isConfirmed
                  ? 'bg-emerald-600'
                  : 'bg-emerald-800 hover:bg-emerald-700 active:scale-95'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-200" />
              <span>{isConfirmed ? '✓ बुकिंग संपन्न (Confirmed!)' : 'कन्फर्म करें (Confirm Gate Pass)'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
