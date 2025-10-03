import { useState, useRef, useEffect } from 'react';
import { MdCalendarToday, MdKeyboardArrowDown, MdDateRange, MdBarChart, MdEventNote } from 'react-icons/md';
import { format, subMonths, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, subQuarters, subYears } from 'date-fns';
import { es } from 'date-fns/locale';

const PeriodSelector = ({ onPeriodChange, className = '' }) => {
  const [selectedType, setSelectedType] = useState('month');
  const [selectedPeriod, setSelectedPeriod] = useState(0); // 0 = actual, 1 = anterior, etc.
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const buttonRef = useRef(null);

  const periodTypes = [
    { value: 'month', label: 'Mes', icon: MdEventNote },
    { value: 'quarter', label: 'Trimestre', icon: MdBarChart },
    { value: 'year', label: 'Año', icon: MdDateRange }
  ];

  const getPeriodOptions = (type) => {
    const now = new Date();
    const options = [];

    for (let i = 0; i < 6; i++) {
      let date, start, end, label;
      
      switch (type) {
        case 'month':
          date = subMonths(now, i);
          start = startOfMonth(date);
          end = endOfMonth(date);
          label = i === 0 ? 'Este mes' : 
                  i === 1 ? 'Mes pasado' : 
                  format(date, 'MMMM yyyy', { locale: es });
          break;
        case 'quarter':
          date = subQuarters(now, i);
          start = startOfQuarter(date);
          end = endOfQuarter(date);
          const quarter = Math.floor(date.getMonth() / 3) + 1;
          label = i === 0 ? 'Este trimestre' : 
                  i === 1 ? 'Trimestre pasado' : 
                  `Q${quarter} ${date.getFullYear()}`;
          break;
        case 'year':
          date = subYears(now, i);
          start = startOfYear(date);
          end = endOfYear(date);
          label = i === 0 ? 'Este año' : 
                  i === 1 ? 'Año pasado' : 
                  date.getFullYear().toString();
          break;
        default:
          continue;
      }

      options.push({
        value: i,
        label,
        start: format(start, 'yyyy-MM-dd'),
        end: format(end, 'yyyy-MM-dd'),
        displayDate: format(start, 'MMM yyyy', { locale: es })
      });
    }

    return options;
  };

  const currentPeriodOptions = getPeriodOptions(selectedType);
  const currentSelection = currentPeriodOptions.find(opt => opt.value === selectedPeriod);

  const handleTypeChange = (newType) => {
    setSelectedType(newType);
    setSelectedPeriod(0);
    const options = getPeriodOptions(newType);
    const selection = options[0];
    onPeriodChange({
      type: newType,
      period: 0,
      start: selection.start,
      end: selection.end,
      label: selection.label
    });
  };

  const handlePeriodChange = (newPeriod) => {
    setSelectedPeriod(newPeriod);
    const selection = currentPeriodOptions.find(opt => opt.value === newPeriod);
    onPeriodChange({
      type: selectedType,
      period: newPeriod,
      start: selection.start,
      end: selection.end,
      label: selection.label
    });
    setIsOpen(false);
  };

  // Calculate dropdown position when opened
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8, // 8px gap
        left: rect.left,
        width: rect.width
      });
    }
  }, [isOpen]);

  return (
    <div className={`relative ${className}`}>
      {/* Selector de tipo de período */}
      <div className="flex bg-gray-50 rounded-xl p-1 mb-3 border border-gray-200">
        {periodTypes.map((type) => {
          const IconComponent = type.icon;
          return (
            <button
              key={type.value}
              onClick={() => handleTypeChange(type.value)}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                selectedType === type.value
                  ? 'bg-white text-blue-600 shadow-md border border-blue-100'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <IconComponent className="h-4 w-4" />
              <span className="hidden sm:block">{type.label}</span>
            </button>
          );
        })}
      </div>

      {/* Selector de período específico */}
      <div className="relative">
        <button
          ref={buttonRef}
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
        >
          <div className="flex items-center gap-3">
            <MdCalendarToday className="h-5 w-5 text-blue-500" />
            <div className="text-left">
              <div className="text-sm font-semibold text-gray-900">
                {currentSelection?.label}
              </div>
              <div className="text-xs text-gray-500">
                {currentSelection?.displayDate}
              </div>
            </div>
          </div>
          <MdKeyboardArrowDown className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`} />
        </button>

      </div>

      {/* Dropdown con opciones - usando fixed positioning */}
      {isOpen && (
        <div 
          className="fixed bg-white border border-gray-200 rounded-xl shadow-xl max-h-64 overflow-y-auto backdrop-blur-sm z-dropdown" 
          style={{ 
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            width: `${dropdownPosition.width}px`
          }}
        >
          {currentPeriodOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handlePeriodChange(option.value)}
              className={`w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors duration-150 first:rounded-t-xl last:rounded-b-xl ${
                option.value === selectedPeriod ? 'bg-blue-50 text-blue-600 border-l-4 border-l-blue-500' : 'text-gray-900'
              }`}
            >
              <div className="text-sm font-semibold">{option.label}</div>
              <div className="text-xs text-gray-500">{option.displayDate}</div>
            </button>
          ))}
        </div>
      )}

      {/* Click outside para cerrar */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-overlay" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default PeriodSelector;