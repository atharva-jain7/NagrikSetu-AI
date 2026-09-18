import React, { useState, useEffect, useRef } from 'react';
import {
  Camera, MapPin, CheckCircle2, ArrowRight, Loader2,
  Sparkles, Image as ImageIcon, Mic, MicOff, Mail, Volume2,
  UploadCloud, RefreshCw, AlertCircle
} from 'lucide-react';
import { submitComplaint, parseUploadedPhoto, reverseGeocode } from '../../api';
import { GrievanceConfirmationModal } from './GrievanceConfirmationModal';

interface ReportWizardProps {
  citizenMobile: string;
  onSuccess: (result: any) => void;
  onCancel: () => void;
}

const MUNICIPAL_ZONES = [
  { name: 'Ghodbunder Road near XYZ School', ward: 'Ward 14', lat: 19.2612, lon: 72.9734 },
  { name: 'Hiranandani Estate Main Boulevard', ward: 'Ward 14', lat: 19.2550, lon: 72.9810 },
  { name: 'Majiwada Central Market Road', ward: 'Ward 8', lat: 19.2185, lon: 72.9860 },
  { name: 'Naupada Commercial Complex', ward: 'Ward 4', lat: 19.1890, lon: 72.9720 },
  { name: 'Thane Station West Bus Stand', ward: 'Ward 2', lat: 19.1860, lon: 72.9750 },
  { name: 'Vartak Nagar Industrial Area', ward: 'Ward 6', lat: 19.2110, lon: 72.9650 },
  { name: 'Kopri Colony Creek Road', ward: 'Ward 1', lat: 19.1770, lon: 72.9830 },
  { name: 'Wagle Estate IT Park Ring Road', ward: 'Ward 7', lat: 19.1950, lon: 72.9510 }
];

// Sample pre-configured photos for convenience
const SAMPLE_PHOTOS = [
  {
    name: 'Pothole on Ghodbunder Road',
    url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=600&q=80',
    lat: 19.2612,
    lon: 72.9734,
    address: 'Ghodbunder Road near XYZ School',
    ward: 'Ward 14'
  },
  {
    name: 'Dry Tap / Water Cut',
    url: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=600&q=80',
    lat: 19.2550,
    lon: 72.9810,
    address: 'Hiranandani Estate Main Boulevard',
    ward: 'Ward 14'
  },
  {
    name: 'Overflowing Waste Dumpster',
    url: 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=600&q=80',
    lat: 19.2185,
    lon: 72.9860,
    address: 'Majiwada Central Market Road',
    ward: 'Ward 8'
  }
];

export const ReportProblemWizard: React.FC<ReportWizardProps> = ({
  citizenMobile,
  onSuccess,
  onCancel
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [rawText, setRawText] = useState<string>('');
  const [citizenEmail, setCitizenEmail] = useState<string>('rahul.verma@example.com');
  
  // Custom Photo State
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [photoFileName, setPhotoFileName] = useState<string | null>(null);
  const [isParsingPhoto, setIsParsingPhoto] = useState<boolean>(false);
  const [hasExifGps, setHasExifGps] = useState<boolean>(false);
  const [locationSource, setLocationSource] = useState<'device_gps' | 'photo_exif' | 'manual'>('manual');
  const [isDetectingLocation, setIsDetectingLocation] = useState<boolean>(false);

  const [detectedLocation, setDetectedLocation] = useState<{
    lat: number;
    lon: number;
    address: string;
    ward: string;
  }>({
    lat: 19.2183,
    lon: 72.9781,
    address: 'Thane Central District',
    ward: 'City Center'
  });

  // Automatically detect user's live device location on initial load
  useEffect(() => {
    detectLiveDeviceLocation();
  }, []);

  // Detect Live Device Location using browser Geolocation + OpenStreetMap Nominatim
  const detectLiveDeviceLocation = () => {
    if (!navigator.geolocation) return;
    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        try {
          const geo = await reverseGeocode(lat, lon);
          setDetectedLocation({
            lat,
            lon,
            address: geo.address || `Real Location [${lat.toFixed(4)}, ${lon.toFixed(4)}]`,
            ward: geo.ward || 'Local Municipal Ward'
          });
          setLocationSource('device_gps');
        } catch (e) {
          setDetectedLocation((prev) => ({
            ...prev,
            lat,
            lon,
            address: `Real GPS Position [${lat.toFixed(4)}, ${lon.toFixed(4)}]`
          }));
          setLocationSource('device_gps');
        } finally {
          setIsDetectingLocation(false);
        }
      },
      (err) => {
        console.warn('Live location permission or timeout:', err.message);
        setIsDetectingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 6000 }
    );
  };

  // Voice Input (Speech Recognition) State
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionResult, setSubmissionResult] = useState<any>(null);

  // Handle Custom Photo Upload from user's device / camera
  const handleCustomPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingPhoto(true);
    setPhotoFileName(file.name);

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result as string;
      setPhotoPreview(base64Data);
      setPhotoBase64(base64Data);

      try {
        const parsed = await parseUploadedPhoto(base64Data);
        if (parsed.success) {
          setHasExifGps(parsed.has_exif_gps);
          if (parsed.has_exif_gps) {
            setLocationSource('photo_exif');
            setDetectedLocation({
              lat: parsed.latitude,
              lon: parsed.longitude,
              address: parsed.address,
              ward: parsed.ward
            });
          }
        }
      } catch (err) {
        console.warn('EXIF parse error:', err);
      } finally {
        setIsParsingPhoto(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Clean Speech Recognition without duplicate repetitions
  const startRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceNotice('Voice recognition is not supported in this browser. Please use Chrome/Edge or click a quick simulator chip below.');
      setTimeout(() => setVoiceNotice(null), 4000);
      return;
    }

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) {}
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false; // Capture natural phrase cleanly
      recognition.interimResults = false; // Fix: do NOT stream interim results to prevent 3x repetition
      recognition.lang = 'en-IN'; // Supports English, Hindi/Hinglish accent

      recognition.onstart = () => {
        setIsRecording(true);
        setVoiceNotice('🎙️ Listening... Speak your problem clearly now.');
      };

      recognition.onresult = (event: any) => {
        let newTranscript = '';
        for (let i = 0; i < event.results.length; ++i) {
          if (event.results[i][0]?.transcript) {
            newTranscript += event.results[i][0].transcript + ' ';
          }
        }
        newTranscript = newTranscript.trim();

        if (newTranscript) {
          setRawText((prev) => {
            const cleanedPrev = prev.trim();
            if (!cleanedPrev) return newTranscript;
            // Prevent accidental immediate duplication
            if (cleanedPrev.toLowerCase().endsWith(newTranscript.toLowerCase())) {
              return cleanedPrev;
            }
            return `${cleanedPrev} ${newTranscript}`;
          });
          setVoiceNotice(`✓ Captured: "${newTranscript}"`);
          setTimeout(() => setVoiceNotice(null), 3000);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech error:', event.error);
        setIsRecording(false);
        if (event.error !== 'no-speech') {
          setVoiceNotice(`Microphone notice: ${event.error}. You can also type or use the test chips.`);
          setTimeout(() => setVoiceNotice(null), 3500);
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e: any) {
      console.error('Speech recognition start failed:', e);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
    setIsRecording(false);
  };

  const toggleVoiceInput = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleSelectSamplePhoto = (sample: typeof SAMPLE_PHOTOS[0]) => {
    setPhotoPreview(sample.url);
    setPhotoBase64(null);
    setPhotoFileName(sample.name);
    setHasExifGps(true);
    setDetectedLocation({
      lat: sample.lat,
      lon: sample.lon,
      address: sample.address,
      ward: sample.ward
    });
  };

  const handleZoneChange = (zoneName: string) => {
    const zone = MUNICIPAL_ZONES.find((z) => z.name === zoneName);
    if (zone) {
      setDetectedLocation({
        lat: zone.lat,
        lon: zone.lon,
        address: zone.name,
        ward: zone.ward
      });
    }
  };

  const handleSubmit = async () => {
    if (!rawText.trim()) return;
    setIsSubmitting(true);

    try {
      // Notice: NO MANUAL CATEGORY SENT! The AI extracts category automatically!
      const result = await submitComplaint({
        citizen_mobile: citizenMobile,
        citizen_name: `Citizen ${citizenMobile.slice(-4)}`,
        citizen_email: citizenEmail,
        raw_text: rawText,
        photo_base64: photoBase64 || undefined,
        photo_name: photoFileName || undefined,
        latitude: detectedLocation.lat,
        longitude: detectedLocation.lon,
        address: detectedLocation.address,
        ward: detectedLocation.ward
      });

      setSubmissionResult(result);
      setIsSubmitting(false);
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  if (submissionResult) {
    return (
      <GrievanceConfirmationModal
        submissionResult={submissionResult}
        citizenMobile={citizenMobile}
        citizenEmail={citizenEmail}
        onViewComplaints={() => onSuccess(submissionResult)}
        onLodgeAnother={() => {
          setSubmissionResult(null);
          setRawText('');
          setPhotoPreview(null);
          setPhotoBase64(null);
          setStep(1);
        }}
      />
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg mx-auto overflow-hidden">
      {/* Header Wizard Steps */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white p-5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <h2 className="text-base font-bold">Report a Civic Problem</h2>
          </div>
          <button onClick={onCancel} className="text-blue-200 hover:text-white text-xs font-semibold">
            Cancel
          </button>
        </div>
        <p className="text-xs text-blue-100 leading-relaxed">
          Simply <strong>upload any photo</strong> from your device and <strong>type or speak</strong> your problem. AI detects the category, department, and priority automatically!
        </p>

        {/* Step indicator */}
        <div className="flex items-center space-x-2 mt-4">
          <div className={`flex-1 h-1.5 rounded-full ${step >= 1 ? 'bg-white' : 'bg-white/30'}`} />
          <div className={`flex-1 h-1.5 rounded-full ${step >= 2 ? 'bg-white' : 'bg-white/30'}`} />
        </div>
      </div>

      <div className="p-6">
        {/* STEP 1: CUSTOM PHOTO UPLOAD & EXIF GPS EXTRACTION */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Step 1: Upload Any Evidence Photo</h3>
                <p className="text-xs text-slate-500">
                  Select any photo from your phone, computer, or camera.
                </p>
              </div>
              <span className="text-[11px] text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-full">
                Custom Upload
              </span>
            </div>

            {/* Hidden File Input */}
            <input
              type="file"
              id="citizen-custom-file-input"
              accept="image/*"
              className="hidden"
              onChange={handleCustomPhotoUpload}
            />

            {/* Photo Preview & Drop Area */}
            <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-4 bg-slate-50 relative overflow-hidden transition-colors">
              {isParsingPhoto ? (
                <div className="py-14 text-center">
                  <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">Reading image & extracting EXIF GPS metadata...</p>
                </div>
              ) : photoPreview ? (
                <div className="space-y-3">
                  <div className="relative rounded-xl overflow-hidden shadow-xs">
                    <img
                      src={photoPreview}
                      alt="Uploaded civic report"
                      className="w-full h-52 object-cover"
                    />
                    <div className="absolute top-3 left-3 bg-black/75 backdrop-blur text-white px-2.5 py-1 rounded-full text-[11px] font-medium flex items-center space-x-1">
                      <Camera className="w-3 h-3 text-emerald-400" />
                      <span>{photoFileName || 'Custom Photo'}</span>
                    </div>
                  </div>

                  <label
                    htmlFor="citizen-custom-file-input"
                    className="w-full py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold rounded-xl text-xs flex items-center justify-center space-x-2 cursor-pointer shadow-xs transition-colors"
                  >
                    <UploadCloud className="w-4 h-4 text-blue-600" />
                    <span>Choose / Upload a Different Photo</span>
                  </label>
                </div>
              ) : (
                <label
                  htmlFor="citizen-custom-file-input"
                  className="py-12 flex flex-col items-center justify-center cursor-pointer space-y-2 text-center"
                >
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
                    <UploadCloud className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      Click to upload any photo from your device
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Supports JPG, PNG, WEBP, HEIC from smartphone or desktop
                    </p>
                  </div>
                </label>
              )}
            </div>

            {/* Real Location Extracted & Live GPS Card */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-white ${
                    locationSource === 'device_gps' ? 'bg-emerald-600' : locationSource === 'photo_exif' ? 'bg-blue-600' : 'bg-slate-700'
                  }`}>
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      {locationSource === 'device_gps'
                        ? '✓ Real Device GPS Active'
                        : locationSource === 'photo_exif'
                        ? '✓ Photo EXIF GPS Extracted'
                        : '📍 Municipal GPS Coordinates'}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      [{detectedLocation.lat.toFixed(5)}, {detectedLocation.lon.toFixed(5)}]
                    </span>
                  </div>
                </div>

                {/* Detect Live Location Button */}
                <button
                  type="button"
                  onClick={detectLiveDeviceLocation}
                  disabled={isDetectingLocation}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center space-x-1.5 shrink-0"
                >
                  {isDetectingLocation ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Detecting...</span>
                    </>
                  ) : (
                    <>
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Use My Live GPS</span>
                    </>
                  )}
                </button>
              </div>

              {/* Editable Real Street / Landmark Address */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Real Street / Landmark / Colony (Type or Edit):
                </label>
                <input
                  type="text"
                  value={detectedLocation.address}
                  onChange={(e) => setDetectedLocation((prev) => ({ ...prev, address: e.target.value }))}
                  placeholder="e.g. 5th Cross Road, Sector 14, Near City Mall"
                  className="w-full text-xs font-semibold p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 shadow-xs"
                />
              </div>

              {/* Editable Ward / Zone */}
              <div className="flex space-x-2">
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">
                    Municipal Ward / Sector:
                  </label>
                  <input
                    type="text"
                    value={detectedLocation.ward}
                    onChange={(e) => setDetectedLocation((prev) => ({ ...prev, ward: e.target.value }))}
                    placeholder="e.g. Ward 14"
                    className="w-full text-xs font-medium p-2 bg-white border border-slate-300 rounded-xl outline-none text-slate-800"
                  />
                </div>

                <div className="flex-1">
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">
                    Quick Zone Presets:
                  </label>
                  <select
                    value={detectedLocation.address}
                    onChange={(e) => handleZoneChange(e.target.value)}
                    className="w-full text-xs font-medium p-2 bg-white border border-slate-300 rounded-xl outline-none text-slate-800 truncate"
                  >
                    <option value="">-- Choose Municipal Landmark --</option>
                    {MUNICIPAL_ZONES.map((z) => (
                      <option key={z.name} value={z.name}>
                        {z.name} ({z.ward})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Optional Sample Photos for rapid demo testing */}
            <div className="pt-1">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                Or quick-test with municipal sample photos:
              </span>
              <div className="grid grid-cols-3 gap-2">
                {SAMPLE_PHOTOS.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelectSamplePhoto(p)}
                    className={`text-[10px] p-2 rounded-lg border text-left font-medium truncate ${
                      photoFileName === p.name
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full mt-2 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl flex items-center justify-center space-x-2 text-sm shadow-md shadow-blue-600/20"
            >
              <span>Next: Describe Problem (Type or Voice)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 2: VOICE OR TYPED DESCRIPTION + EMAIL */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Step 2: Tell Us What Happened</h3>
                <p className="text-xs text-slate-500">
                  Type or click the microphone to speak. AI will handle the rest!
                </p>
              </div>

              {/* Speech-to-Text Microphone Button */}
              <button
                type="button"
                onClick={toggleVoiceInput}
                className={`p-2.5 rounded-full transition-all flex items-center space-x-1.5 text-xs font-bold shadow-md ${
                  isRecording
                    ? 'bg-rose-600 text-white animate-pulse'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                }`}
                title={isRecording ? 'Click to Stop Listening' : 'Click to Speak'}
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                <span className="hidden sm:inline">{isRecording ? 'Stop' : 'Voice Input'}</span>
              </button>
            </div>

            {/* Voice Status Alert */}
            {voiceNotice && (
              <div className="p-2 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs flex items-center space-x-1.5 animate-in fade-in">
                <Volume2 className="w-3.5 h-3.5 text-blue-600" />
                <span>{voiceNotice}</span>
              </div>
            )}

            {/* Description Textarea */}
            <div>
              <textarea
                rows={4}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Type your issue or click Voice Input... (e.g. 'Huge pothole near XYZ School' or 'Paani nahi aa raha 3 din se')"
                className="w-full p-3 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none text-xs text-slate-900 font-medium resize-none"
              />
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>Your Email Address (for resolution updates)</span>
              </label>
              <input
                type="email"
                value={citizenEmail}
                onChange={(e) => setCitizenEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none text-xs font-semibold text-slate-800"
              />
            </div>

            {/* Quick Demo Voice/Text Shortcut Chips */}
            <div>
              <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                Quick Voice / Text Simulators (Click to test):
              </span>
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => setRawText('Huge pothole near XYZ School, traffic getting heavily choked.')}
                  className="w-full text-left text-[11px] p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 flex items-center justify-between"
                >
                  <span>🇬🇧 "Huge pothole near XYZ School, traffic getting heavily choked."</span>
                  <span className="text-[10px] text-blue-600 font-bold">Auto → PWD</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRawText('Paani nahi aa raha 3 dino se, pure block me dry taps hai.')}
                  className="w-full text-left text-[11px] p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 flex items-center justify-between"
                >
                  <span>🇮🇳 Hinglish: "Paani nahi aa raha 3 dino se, pure block me dry taps hai."</span>
                  <span className="text-[10px] text-cyan-600 font-bold">Auto → Water</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRawText('सड़क पर बड़ा गड्ढा है स्कूल के सामने, बाइक स्लिप हो रही है।')}
                  className="w-full text-left text-[11px] p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 flex items-center justify-between"
                >
                  <span>🇮🇳 Hindi: "सड़क पर बड़ा गड्ढा है स्कूल के सामने, बाइक स्लिप हो रही है।"</span>
                  <span className="text-[10px] text-blue-600 font-bold">Auto → PWD</span>
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setStep(1)}
                className="text-xs text-slate-600 hover:text-slate-900 font-medium"
              >
                Back to Photo
              </button>
              <button
                onClick={handleSubmit}
                disabled={!rawText.trim() || isSubmitting}
                className="py-3 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold rounded-xl flex items-center space-x-2 text-sm shadow-md shadow-blue-600/20"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>AI Classifying & Routing...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Grievance</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
