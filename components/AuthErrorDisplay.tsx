import React from 'react';
import { XMarkIcon } from './icons';

// FIX: Renamed from AuthError to DisplayableAuthError to match AuthContext.tsx.
interface DisplayableAuthError {
  title: string;
  message: string;
  domain?: string;
}

interface AuthErrorDisplayProps {
  // FIX: Updated prop type to use the renamed DisplayableAuthError interface.
  error: DisplayableAuthError;
  onClose: () => void;
}

const AuthErrorDisplay: React.FC<AuthErrorDisplayProps> = ({ error, onClose }) => {
  const [copied, setCopied] = React.useState(false);

  const copyToClipboard = () => {
    if (error.domain) {
      navigator.clipboard.writeText(error.domain).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg modal-enter" role="alertdialog" aria-modal="true" aria-labelledby="error-title">
        <div className="p-6 border-b border-slate-200">
          <h2 id="error-title" className="text-xl font-bold text-slate-800">{error.title}</h2>
        </div>
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <p className="text-slate-600">{error.message}</p>
          {error.domain && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-slate-700">Точний домен, відхилений Firebase:</h4>
                <div className="bg-slate-100 p-3 rounded-md flex items-center justify-between mt-1">
                  <code className="text-sm font-semibold text-slate-700 truncate">{error.domain}</code>
                  <button onClick={copyToClipboard} className="text-sm font-semibold text-blue-600 hover:text-blue-800 flex-shrink-0 ml-2">
                    {copied ? 'Скопійовано!' : 'Копіювати'}
                  </button>
                </div>
              </div>
              
              <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-900 p-4 rounded-r-lg">
                 <h4 className="font-bold">Рекомендація для Google AI Studio</h4>
                 <p className="text-sm mt-2">Домени в Google AI Studio можуть змінюватися. Щоб уникнути цієї помилки в майбутньому, додайте наступні загальні домени до вашого списку авторизованих доменів у Firebase:</p>
                 <ul className="list-disc list-inside text-sm font-semibold mt-2 space-y-1">
                    <li>usercontent.goog</li>
                    <li>google.com</li>
                 </ul>
              </div>

              <div>
                <h4 className="font-semibold text-slate-700">Як це виправити:</h4>
                <ol className="list-decimal list-inside text-sm text-slate-600 mt-2 space-y-2">
                  <li>Відкрийте <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Firebase Console</a>.</li>
                  <li>Перейдіть до вашого проекту &rarr; Authentication &rarr; Settings &rarr; Authorized domains.</li>
                  <li>Натисніть "Add domain" та вставте скопійований домен.</li>
                  <li>Збережіть зміни та спробуйте увійти знову.</li>
                </ol>
                <div className="mt-4 text-xs text-slate-500 space-y-2">
                    <p><span className="font-semibold">Порада 1:</span> Перевірте, чи немає помилок у назві домену, яку ви додали у Firebase.</p>
                    <p><span className="font-semibold">Порада 2:</span> Після додавання домену зачекайте кілька хвилин. Іноді зміни у Firebase застосовуються не миттєво.</p>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-end p-6 bg-slate-50 rounded-b-xl border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="bg-white py-2 px-4 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Зрозуміло
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthErrorDisplay;
