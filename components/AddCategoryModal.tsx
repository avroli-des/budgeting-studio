
import React, { useState, useEffect } from 'react';
import { Category } from '../types';

interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (categoryName: string) => void;
  categoryToEdit?: Category | null;
}

const AddCategoryModal: React.FC<AddCategoryModalProps> = ({ isOpen, onClose, onSave, categoryToEdit }) => {
  const [categoryName, setCategoryName] = useState('');
  const isEditing = !!categoryToEdit;

  useEffect(() => {
    if (isOpen) {
      setCategoryName(isEditing ? categoryToEdit.name : '');
    }
  }, [isOpen, categoryToEdit, isEditing]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (categoryName.trim()) {
      onSave(categoryName.trim());
      onClose();
    }
  };

  if (!isOpen) return null;

  const title = isEditing ? 'Редагувати категорію' : 'Додати категорію';
  const buttonText = isEditing ? 'Зберегти' : 'Додати категорію';

  return (
    <div className="fixed inset-0 z-30 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md modal-enter" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
            <div className="p-6 border-b border-slate-200">
                 <h2 className="text-xl font-bold text-slate-800">{title}</h2>
            </div>
            <div className="p-6">
                <label htmlFor="categoryName" className="block text-sm font-medium text-slate-700">Назва категорії</label>
                <input
                type="text"
                id="categoryName"
                value={categoryName}
                onChange={e => setCategoryName(e.target.value)}
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                required
                autoFocus
                />
            </div>
            <div className="flex justify-end space-x-3 p-6 bg-slate-50 rounded-b-xl border-t border-slate-200">
                <button type="button" onClick={onClose} className="bg-white py-2 px-4 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                Скасувати
                </button>
                <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                {buttonText}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default AddCategoryModal;