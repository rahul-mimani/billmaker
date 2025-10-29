// src/components/CustomerInput.tsx
import React, { useEffect, useMemo, useState } from 'react';
import Fuse from 'fuse.js';
import { getCustomers } from '../storage/customerStorage';

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxSuggestions?: number;
}

const CustomerInput: React.FC<Props> = ({ value, onChange, maxSuggestions = 8 }) => {
  const [customers, setCustomers] = useState<string[]>([]);
  const [filtered, setFiltered] = useState<string[]>([]);
  const [showList, setShowList] = useState(false);

  useEffect(() => {
    const load = async () => {
      const list = await getCustomers();
      setCustomers(list);
    };
    load();
  }, []);

  const fuse = useMemo(() => {
    return new Fuse(customers, {
      threshold: 0.45,
      distance: 100,
      minMatchCharLength: 1,
    });
  }, [customers]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);

    if (val.trim() === '') {
      setFiltered([]);
      setShowList(false);
      return;
    }

    // Do a fast pre-filter (startsWith) for speed and then fuzzy
    const pre = customers.filter(c => c.toLowerCase().startsWith(val.toLowerCase()));
    if (pre.length >= 5) {
      setFiltered(pre.slice(0, maxSuggestions));
      setShowList(true);
      return;
    }

    const results = fuse.search(val);
    setFiltered(results.map(r => r.item).slice(0, maxSuggestions));
    setShowList(true);
  };

  const handleSelect = (name: string) => {
    onChange(name);
    setFiltered([]);
    setShowList(false);
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={handleChange}
        onFocus={() => value.trim() && setShowList(true)}
        onBlur={() => setTimeout(() => setShowList(false), 150)}
        placeholder="Enter customer's name"
        className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500 transition bg-white text-slate-900"
        autoComplete="off"
      />
      {showList && filtered.length > 0 && (
        <ul className="absolute z-10 bg-white border rounded shadow mt-1 w-full max-h-48 overflow-y-auto">
          {filtered.map((name, i) => (
            <li
              key={i}
              onMouseDown={() => handleSelect(name)} // onMouseDown to avoid blur race
              className="p-2 hover:bg-sky-100 cursor-pointer"
            >
              {name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CustomerInput;
