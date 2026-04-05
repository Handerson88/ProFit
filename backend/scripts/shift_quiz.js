const fs = require('fs');
const path = require('path');

const quizPath = path.join(__dirname, '../../frontend/src/pages/Quiz.tsx');
let content = fs.readFileSync(quizPath, 'utf8');

// Update fieldMap
content = content.replace(
  /'understands_calories', 'daily_calorie_target', 'primary_objective'/,
  /'understands_calories', 'daily_calorie_target', 'evolution_chart', 'primary_objective'/
);

// Update stepMeta
const stepMetaRegex = /\{ id: 10, title: 'SEU DESEJO'[\s\S]*?\{ id: 17, title: '', question: '', helper: '', icon: Activity \},/m;
const newStepMeta = `{ id: 10, title: 'EVOLUÇÃO', question: 'Sua musculatura responde melhor do que você imagina', helper: 'Veja o que acontece quando você treina corretamente.', icon: Target },
    { id: 11, title: 'SEU DESEJO', question: 'O que você gostaria de conquistar?', helper: 'Isso nos ajuda a personalizar sua jornada.', icon: Target },
    { id: 12, title: 'ESTADO EMOCIONAL', question: 'Como você se sente hoje?', helper: 'Sua resposta nos ajuda a personalizar sua experiência.', icon: User },
    { id: 13, title: '', question: '', helper: '', icon: User },
    { id: 14, title: 'OBSTÁCULOS', question: 'O que está te impedindo?', helper: 'Selecione todas as opções que se aplicam.', icon: Activity },
    { id: 15, title: '', question: '', helper: '', icon: Activity },
    { id: 16, title: '', question: '', helper: '', icon: Activity },
    { id: 17, title: '', question: '', helper: '', icon: Activity },
    { id: 18, title: '', question: '', helper: '', icon: Activity },`;
content = content.replace(stepMetaRegex, newStepMeta);

// Now replace cases in renderContent from 17 down to 10
for (let i = 17; i >= 10; i--) {
  content = content.replace(new RegExp('case ' + i + ':', 'g'), 'case ' + (i + 1) + ':');
}

// Same for step references in the layout
content = content.replace(/step !== 12 && step !== 14 && step !== 15 && step !== 16 && step !== 17/g, 'step !== 13 && step !== 15 && step !== 16 && step !== 17 && step !== 18');
content = content.replace(/step === 12 \|\| step === 17/g, 'step === 13 || step === 18');
content = content.replace(/step === 16 \|\| step === 17/g, 'step === 17 || step === 18');
content = content.replace(/step === 13/g, 'step === 14');
content = content.replace(/setStep\\(12\\)/g, 'setStep(13)');

// Insert new case 10
const case10Block = `      case 10:
        return (
          <div className="flex flex-col items-center justify-center space-y-8 py-4 animate-in fade-in duration-700">
            <div className="w-full max-w-sm aspect-[4/3] bg-gradient-to-tr from-gray-900 via-gray-800 to-[var(--bg-card)] rounded-3xl border border-gray-700/50 p-6 flex flex-col relative overflow-hidden shadow-2xl">
              <div className="flex flex-col items-center justify-center z-10 w-full mb-auto">
                 <Target className="w-10 h-10 text-primary mb-3 opacity-90" />
              </div>
              
              <svg viewBox="0 0 100 100" className="w-full h-full absolute inset-0 mt-8 overflow-visible">
                <defs>
                  <linearGradient id="gradientFilled" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="0%" stopColor="#4ADE80" stopOpacity="0.5" />
                     <stop offset="100%" stopColor="#4ADE80" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <motion.path 
                   d="M -10 110 Q 30 90, 50 60 T 110 30" 
                   fill="none" stroke="#4ADE80" strokeWidth="4" 
                   initial={{ pathLength: 0 }}
                   animate={{ pathLength: 1 }}
                   transition={{ duration: 2, ease: "easeInOut" }}
                />
                <motion.path 
                   d="M -10 110 Q 30 90, 50 60 T 110 30 L 110 110 L -10 110 Z"
                   fill="url(#gradientFilled)"
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   transition={{ duration: 1, delay: 1 }}
                />
                
                {/* Protocol Markers */}
                <motion.circle cx="24" cy="86" r="4" fill="#111827" stroke="#4ADE80" strokeWidth="2" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.8 }} />
                <motion.circle cx="50" cy="60" r="4" fill="#111827" stroke="#4ADE80" strokeWidth="2" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.4 }} />
                
                <motion.g initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 2, type: 'spring' }}>
                   <circle cx="90" cy="38" r="8" fill="#4ADE80" />
                </motion.g>
              </svg>

              <div className="absolute bottom-4 left-6 right-6 flex justify-between w-[calc(100%-3rem)] text-[10px] font-bold text-gray-400 z-10">
                <span>3 Dias</span>
                <span className="ml-4">7 Dias</span>
                <span className="text-primary flex items-center gap-1"><Trophy className="w-3 h-3" /> 30 Dias</span>
              </div>
            </div>
          </div>
        );
      case 11:`;

content = content.replace('      case 11:', case10Block);

// Update isCurrentStepValid
content = content.replace(/case 11: return !!formData.primary_objective;/, 'case 10: return true;\n      case 11: return !!formData.primary_objective;');

fs.writeFileSync(quizPath, content);
console.log('Quiz.tsx updated successfully');
