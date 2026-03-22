import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Image as ImageIcon, ZapOff, Aperture, Check, Loader2, Apple, ScanBarcode, FileText, AlertTriangle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import { trackingService } from '../services/trackingService';
import { ConfirmModal } from '../components/ConfirmModal';

export const FoodScanner = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('Scan Food');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [qualityError, setQualityError] = useState<{message: string, tips: string[]} | null>(null);
  const [limitReached, setLimitReached] = useState<boolean>(false);
  const [confirmOptions, setConfirmOptions] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'danger' as 'danger' | 'warning' | 'info' | 'success',
    confirmText: 'OK',
    showCancel: false,
    onConfirm: async () => {}
  });

  const closeConfirm = () => setConfirmOptions(prev => ({ ...prev, isOpen: false }));

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);
  
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setHasPermission(true);
    } catch (err) {
      console.error("Camera error:", err);
      setHasPermission(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleCapture = async () => {
    if (isScanning || scanResult || !videoRef.current) return;
    
    trackingService.logEvent('scan_started', { type: 'camera' }).catch(console.error);
    
    // Capture the frame from the video
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0);
    
    // Freeze frame
    videoRef.current.pause();
    setIsScanning(true);
    
    try {
      // Convert canvas to blob
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.8));
      if (!blob) throw new Error("Failed to capture image");

      const file = new File([blob], 'scan.jpg', { type: 'image/jpeg' });
      console.log("Image captured, size:", file.size);
      
      // Upload to OpenAI Vision endpoint
      console.log("Sending to AI...");
      const result = await api.meals.scan(file);
      console.log("SCANNER DEBUG - API Result:", result);
      
      const foodData = {
        ...result,
        name: result.dish_name || result.meal_name || result.food_name || result.name || 'Prato Identificado',
        calories: result.calories ?? result.meal_calories ?? 0,
        protein: result.protein ?? 0,
        carbs: result.carbs ?? 0,
        fat: result.fat ?? result.fats ?? 0,
        ingredients: result.ingredients || [],
        image_url: result.image_url,
        calorie_status: result.calorie_status,
        recommendation: result.recommendation,
        nutrition_observation: result.nutrition_observation || result.recommendation
      };

      const localImageUrl = URL.createObjectURL(file);
      const base64Image = await fileToBase64(file);
      console.log("SCANNER DEBUG - Local Image URL created:", localImageUrl);

      navigate('/scan-result', { 
        state: { food: foodData, localImage: localImageUrl, base64Image: base64Image } 
      });
      trackingService.logEvent('scan_success', { type: 'camera', food: foodData.name }).catch(console.error);
    } catch (err: any) {
      console.error("Scan failed", err);
      if (err.response?.status === 422) {
        setQualityError({
          message: err.response.data.message,
          tips: err.response.data.tips
        });
      } else if (err.response?.status === 403) {
        setLimitReached(true);
      } else {
        trackingService.logEvent('scan_failed', { type: 'camera', error: err.message }).catch(console.error);
        if (videoRef.current) videoRef.current.play();
        setConfirmOptions({
          isOpen: true,
          title: 'Erro de Análise',
          message: 'Não conseguimos processar esta imagem. Por favor, verifique sua conexão ou tente novamente.',
          type: 'danger',
          confirmText: 'Tentar Novamente',
          showCancel: false,
          onConfirm: async () => {}
        });
      }
    } finally {
      setIsScanning(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
    if (!file) return;
    console.log("File selected from library:", file.name, "size:", file.size);

    setIsScanning(true);
    try {
      // Upload to OpenAI Vision endpoint
      console.log("Uploading file to AI...");
      const result = await api.meals.scan(file);
      console.log("SCANNER DEBUG - Library Result:", result);
      
      const foodData = {
        ...result,
        name: result.dish_name || result.meal_name || result.food_name || result.name || 'Prato Identificado',
        calories: result.calories ?? result.meal_calories ?? 0,
        protein: result.protein ?? 0,
        carbs: result.carbs ?? 0,
        fat: result.fat ?? result.fats ?? 0,
        ingredients: result.ingredients || [],
        image_url: result.image_url,
        calorie_status: result.calorie_status,
        recommendation: result.recommendation,
        nutrition_observation: result.nutrition_observation || result.recommendation
      };

      const localImageUrl = URL.createObjectURL(file);
      const base64Image = await fileToBase64(file);
      console.log("SCANNER DEBUG - Local Image URL created (Library):", localImageUrl);

      navigate('/scan-result', { 
        state: { food: foodData, localImage: localImageUrl, base64Image: base64Image } 
      });
    } catch (err: any) {
      console.error("Upload failed", err);
      if (err.response?.status === 422) {
        setQualityError({
          message: err.response.data.message,
          tips: err.response.data.tips
        });
      } else if (err.response?.status === 403) {
        setLimitReached(true);
      } else {
        setConfirmOptions({
          isOpen: true,
          title: 'Erro de Análise',
          message: "Erro ao analisar imagem: " + (err.message || "Erro desconhecido"),
          type: 'danger',
          confirmText: 'Fechar',
          showCancel: false,
          onConfirm: async () => {}
        });
      }
    } finally {
      setIsScanning(false);
      // Reset input value to allow the same file to be selected again
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const resetScanner = () => {
    if (videoRef.current) videoRef.current.play();
    setScanResult(null);
    setIsScanning(false);
  };

  const addToMeal = () => {
    navigate('/log-meal', { state: { food: scanResult } });
  };

  if (hasPermission === false) {
    return (
      <div className="h-screen bg-[#F6F7F9] flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 bg-white rounded-[24px] shadow-sm flex items-center justify-center mb-6">
          <Aperture className="w-10 h-10 text-gray-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Camera Access Denied</h2>
        <p className="text-gray-500 mb-8 max-w-xs font-medium">Camera permission is required to scan food. Please enable it in your browser settings.</p>
        <button onClick={startCamera} className="bg-gradient-to-r from-[#A8E063] to-[#56AB2F] shadow-lg text-white font-bold uppercase tracking-widest px-8 py-4 rounded-full active:scale-95 transition-all">
          Retry Camera
        </button>
        <button onClick={() => navigate(-1)} className="mt-8 text-gray-500 font-bold hover:text-gray-800 transition-colors">Go Back</button>
      </div>
    );
  }

  const tabs = [
    { name: 'Scan Food', icon: Apple },
    { name: 'Barcode', icon: ScanBarcode },
    { name: 'Food label', icon: FileText },
    { name: 'Library', icon: ImageIcon }
  ];

  return (
    <div className="main-wrapper bg-black">
      <div className="app-container h-screen bg-black overflow-hidden relative shadow-none border-none">
      
        {/* Live Camera Feed */}
        <video 
          ref={videoRef}
          autoPlay 
          playsInline 
          muted 
          className="absolute inset-0 w-full h-full object-cover z-0"
        />

        {/* Dimmed Overlay with Hole for Scan Frame */}
        {!scanResult && !isScanning && (
          <div className="absolute inset-0 z-10 pointer-events-none">
            <div className="absolute inset-0 bg-black/40"></div>
            {/* The "hole" effect using shadow padding logic */}
            <div 
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '300px',
                height: '300px',
                borderRadius: '40px',
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)',
              }}
            />
          </div>
        )}

        {/* Soft gradient overlay at top and bottom to make UI readable */}
        <div className="absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-black/60 via-black/20 to-transparent pointer-events-none z-20"></div>
        <div className="absolute inset-x-0 bottom-0 h-96 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none z-20"></div>

        {/* Top Header */}
        <div className="relative z-20 flex justify-between items-center px-6 pt-10">
          <button 
            onClick={() => navigate(-1)} 
            className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-5 h-5 text-gray-800" />
          </button>
          
          <h1 className="text-xl font-semibold text-white tracking-wide drop-shadow-md">Scanner</h1>
          
          <div className="w-12"></div>
        </div>

        {/* Central Scan Frame */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
          <div className="relative w-[300px] h-[300px]">
            
            {/* The Rounded Frame */}
            <div className="absolute inset-0 border-[2px] border-white rounded-[40px] shadow-[0_0_30px_rgba(0,0,0,0.2)]"></div>
            
            {/* Corner Markers for guidance - thickened for better focus */}
            <div className="absolute -top-1 -left-1 w-12 h-12 border-t-[6px] border-l-[6px] rounded-tl-[40px] border-white"></div>
            <div className="absolute -top-1 -right-1 w-12 h-12 border-t-[6px] border-r-[6px] rounded-tr-[40px] border-white"></div>
            <div className="absolute -bottom-1 -left-1 w-12 h-12 border-b-[6px] border-l-[6px] rounded-bl-[40px] border-white"></div>
            <div className="absolute -bottom-1 -right-1 w-12 h-12 border-b-[6px] border-r-[6px] rounded-br-[40px] border-white"></div>

            {/* Glowing Scanning Line */}
            {!scanResult && hasPermission && (
              <motion.div 
                animate={{ top: ['0%', '100%'] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                className="absolute left-0 right-0 h-[2px] bg-white transform-gpu"
                style={{
                  boxShadow: '0 0_15px_4px_rgba(255,255,255,0.4),_0_0_30px_8px_rgba(255,255,255,0.1)',
                  width: '100%',
                }}
              />
            )}

            {/* Analyzing Overlay */}
            <AnimatePresence>
              {isScanning && (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 rounded-[40px] backdrop-blur-md"
                >
                  <Loader2 className="w-12 h-12 text-white animate-spin mb-3" />
                  <p className="text-white font-bold tracking-widest uppercase text-sm drop-shadow-md">Analyzing...</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Quality Error Overlay */}
            <AnimatePresence>
              {qualityError && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-[40px] backdrop-blur-md z-50 p-6 text-center"
                >
                  <AlertTriangle className="w-12 h-12 text-yellow-500 mb-4" />
                  <h3 className="text-white font-black text-lg mb-2 leading-tight">Ops! Não foi possível identificar</h3>
                  <p className="text-white/70 text-sm mb-6 leading-relaxed">
                    {qualityError.message}
                  </p>
                  
                  <div className="w-full bg-white/10 rounded-2xl p-4 mb-6 text-left">
                    <p className="text-[10px] font-black uppercase text-[#A8E063] mb-3 tracking-widest">Dicas para uma boa foto:</p>
                    <ul className="space-y-2">
                      {qualityError.tips.map((tip, i) => (
                        <li key={i} className="flex items-start space-x-2 text-[12px] text-white/90">
                          <Check className="w-3.5 h-3.5 text-[#A8E063] mt-0.5" />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button 
                    onClick={() => {
                      setQualityError(null);
                      if (videoRef.current) videoRef.current.play();
                    }}
                    className="w-full py-4 bg-[#56AB2F] text-white font-black rounded-2xl text-sm uppercase tracking-wider active:scale-95 transition-all shadow-lg shadow-primary/20"
                  >
                    Tirar nova foto
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Limit Reached Overlay */}
            <AnimatePresence>
              {limitReached && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 rounded-[40px] backdrop-blur-xl z-[60] p-8 text-center"
                >
                  <div className="w-20 h-20 bg-amber-500/20 text-amber-500 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
                    <Clock className="w-10 h-10" />
                  </div>
                  
                  <h3 className="text-white font-black text-2xl mb-4 leading-tight">Limite Atingido!</h3>
                  
                  <div className="bg-white/10 rounded-3xl p-6 mb-8 border border-white/10">
                    <p className="text-white text-base font-medium leading-relaxed">
                       Você atingiu o limite diário de scans do plano atual. Volte amanhã ou atualize seu plano.
                    </p>
                  </div>
                  
                  <div className="w-full space-y-3">
                    <button 
                      onClick={() => navigate('/checkout')}
                      className="w-full py-5 bg-[#56AB2F] text-white font-black rounded-2xl text-sm uppercase tracking-wider active:scale-95 transition-all shadow-lg shadow-primary/20"
                    >
                      Seja Elite Agora 🚀
                    </button>
                    <button 
                      onClick={() => navigate('/home')}
                      className="w-full py-4 bg-transparent border-2 border-white/20 text-white font-bold rounded-2xl text-sm uppercase tracking-wider active:scale-95 transition-all"
                    >
                      Voltar ao Início
                    </button>
                   </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Bottom Immersive Interface */}
        <div className="absolute bottom-0 inset-x-0 z-40 pb-12 flex flex-col items-center">
          
          {/* Compact Options Row */}
          {!scanResult && !isScanning && (
            <div className="w-full max-w-md px-4 flex justify-center items-stretch space-x-3 mb-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.name;
                return (
                  <button 
                    key={tab.name}
                    onClick={() => {
                      setActiveTab(tab.name);
                      if (tab.name === 'Library') fileInputRef.current?.click();
                    }}
                    className={`flex-1 min-w-0 h-[84px] rounded-2xl backdrop-blur-md transition-all flex flex-col items-center justify-center border-2 ${
                      isActive 
                        ? 'bg-white/10 border-[#56AB2F] shadow-[0_0_15px_rgba(86,171,47,0.3)]' 
                        : 'bg-white/5 border-transparent hover:bg-white/10'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mb-1.5 ${isActive ? 'text-[#A8E063]' : 'text-white/70'}`} strokeWidth={isActive ? 2.5 : 2} />
                    <span className={`text-[10px] font-bold tracking-tight uppercase text-center w-full px-1 ${isActive ? 'text-white' : 'text-white/50'}`}>
                      {tab.name}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Action Buttons Area */}
          <div className="w-full h-24 flex items-center justify-center relative">
            <AnimatePresence mode="wait">
              {!scanResult ? (
                <motion.div 
                  key="capture-controls"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="w-full flex justify-between items-center px-4"
                >
                  {/* Gallery Button */}
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-14 h-14 bg-white/20 backdrop-blur-md border border-white/30 rounded-full flex items-center justify-center active:scale-95 transition-transform group hover:bg-white/30"
                  >
                    <ImageIcon className="w-6 h-6 text-white" />
                  </button>

                  {/* Main Shutter Button */}
                  <button 
                    onClick={handleCapture}
                    disabled={isScanning}
                    className="relative w-[84px] h-[84px] rounded-full border-[4px] border-white flex items-center justify-center group outline-none active:scale-95 transition-all shadow-[0_4px_30px_rgba(0,0,0,0.3)]"
                  >
                    <div className="w-[68px] h-[68px] bg-white rounded-full flex items-center justify-center transform group-active:scale-95 transition-transform duration-200">
                    </div>
                  </button>

                  {/* Flash/Mute Button */}
                  <button className="w-14 h-14 bg-white/20 backdrop-blur-md border border-white/30 rounded-full flex items-center justify-center active:scale-95 transition-transform group hover:bg-white/30">
                    <ZapOff className="w-6 h-6 text-white" />
                  </button>
                </motion.div>
              ) : (
                <motion.div 
                  key="result-card"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 30 }}
                  className="w-full absolute inset-0 flex items-center justify-center"
                >
                  {/* Result Card styled as an elegant floating panel */}
                  <div className="w-full max-w-sm bg-white/95 backdrop-blur-2xl rounded-[32px] p-6 shadow-2xl border border-white">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#56AB2F] mb-1">Detected</p>
                        <h3 className="text-2xl font-black text-gray-900">{scanResult.name}</h3>
                      </div>
                      <div className="bg-[#A8E063]/20 text-[#56AB2F] px-3 py-1.5 rounded-full text-xs font-bold leading-none">
                        {scanResult.confidence}%
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-[20px] p-4 flex justify-between mb-6">
                       <div className="text-center">
                         <p className="text-[10px] font-bold uppercase text-gray-400 mb-1">Energy</p>
                         <p className="text-xl font-black text-gray-900">{scanResult.calories} <span className="text-xs font-bold text-gray-400">kcal</span></p>
                       </div>
                       <div className="w-px bg-gray-200 block"></div>
                       <div className="text-center">
                         <p className="text-[10px] font-bold uppercase text-gray-400 mb-1">Protein</p>
                         <p className="text-xl font-black text-gray-900">{scanResult.protein}<span className="text-sm">g</span></p>
                       </div>
                       <div className="w-px bg-gray-200 block"></div>
                       <div className="text-center">
                         <p className="text-[10px] font-bold uppercase text-gray-400 mb-1">Carbs</p>
                         <p className="text-xl font-black text-gray-900">{scanResult.carbs}<span className="text-sm">g</span></p>
                       </div>
                    </div>

                    <div className="flex space-x-3">
                      <button 
                        onClick={resetScanner}
                        className="flex-1 py-4 bg-gray-100 text-gray-700 font-bold rounded-2xl active:scale-95 transition-all text-sm uppercase tracking-wider hover:bg-gray-200"
                      >
                        Retake
                      </button>
                      <button 
                        onClick={addToMeal}
                        className="flex-[2] py-4 bg-gradient-to-r from-[#A8E063] to-[#56AB2F] shadow-lg shadow-primary/30 text-white font-black rounded-2xl active:scale-95 transition-all text-sm uppercase tracking-wider flex items-center justify-center space-x-2"
                      >
                        <Check className="w-5 h-5" />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        className="hidden" 
      />

      <ConfirmModal 
        isOpen={confirmOptions.isOpen}
        onClose={closeConfirm}
        title={confirmOptions.title}
        message={confirmOptions.message}
        type={confirmOptions.type}
        confirmText={confirmOptions.confirmText}
        showCancel={confirmOptions.showCancel}
        onConfirm={confirmOptions.onConfirm}
      />
    </div>
  );
};
