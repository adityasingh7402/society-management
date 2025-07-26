import React, { useState, useEffect } from 'react';
import { User, Building, Home, Users, X } from 'lucide-react';

const SelectionPopup = ({
  isOpen,
  onClose,
  onSelectType,
  title = "Generate Bill For",
  showIndividual = true,
  showBlock = true,
  showFloor = true,
  showBulk = true
}) => {
  const [selectedOption, setSelectedOption] = useState(null);
  
  if (!isOpen) return null;

  const handleOptionClick = (type) => {
    setSelectedOption(type);
    setTimeout(() => {
      onSelectType(type);
      setSelectedOption(null);
    }, 200);
  };

  const options = [
    {
      key: 'individual',
      icon: User,
      title: 'Individual Resident',
      subtitle: 'Generate bill for a single resident',
      gradient: 'from-blue-500 to-cyan-500',
      hoverGradient: 'from-blue-600 to-cyan-500',
      show: showIndividual
    },
    {
      key: 'block',
      icon: Building,
      title: 'Block-wise',
      subtitle: 'Generate bills for entire block',
      gradient: 'from-emerald-500 to-teal-500',
      hoverGradient: 'from-emerald-600 to-teal-600',
      show: showBlock
    },
    {
      key: 'floor',
      icon: Home,
      title: 'Floor-wise',
      subtitle: 'Generate bills for specific floor',
      gradient: 'from-purple-500 to-pink-500',
      hoverGradient: 'from-purple-600 to-pink-600',
      show: showFloor
    },
    {
      key: 'bulk',
      icon: Users,
      title: 'Bulk Generation',
      subtitle: 'Generate multiple bills at once',
      gradient: 'from-orange-500 to-red-500',
      hoverGradient: 'from-orange-600 to-red-600',
      show: showBulk
    }
  ].filter(option => option.show);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-black/60 via-black/50 to-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 w-full max-w-2xl max-h-[90vh] overflow-hidden animate-in fade-in duration-300">
        
        {/* Header */}
        <div className="text-center mb-8 relative">
          <button
            onClick={onClose}
            className="absolute -top-2 -right-2 w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors duration-200"
          >
            <X size={16} className="text-gray-600" />
          </button>
          
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
            <Building size={32} className="text-white" />
          </div>
          
          <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
            {title}
          </h2>
          <p className="text-gray-600 text-lg">Choose your billing preference</p>
        </div>
        
        {/* Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          {options.map((option) => {
            const Icon = option.icon;
            const isSelected = selectedOption === option.key;
            
            return (
              <button
                key={option.key}
                onClick={() => handleOptionClick(option.key)}
                className={`group relative overflow-hidden bg-gradient-to-br ${option.gradient} hover:${option.hoverGradient} 
                  rounded-2xl p-6 text-white transition-all duration-300 transform hover:scale-105 hover:shadow-xl
                  ${isSelected ? 'scale-95 shadow-inner' : 'shadow-lg hover:shadow-2xl'}
                  border border-white/20`}
              >
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="mb-4 p-3 bg-white/20 rounded-xl backdrop-blur-sm group-hover:bg-white/30 transition-colors duration-300">
                    <Icon size={32} className="text-white" />
                  </div>
                  
                  <h3 className="text-xl font-bold mb-2">{option.title}</h3>
                  <p className="text-white/90 text-sm leading-relaxed">{option.subtitle}</p>
                </div>
                
                {/* Subtle animation overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              </button>
            );
          })}
        </div>
        
        {/* Footer */}
        <div className="flex justify-center">
          <button
            onClick={onClose}
            className="px-8 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors duration-200 border border-gray-200 hover:border-gray-300"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default SelectionPopup; 