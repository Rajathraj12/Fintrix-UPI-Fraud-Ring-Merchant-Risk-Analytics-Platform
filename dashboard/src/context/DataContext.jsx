import React, { createContext, useState, useEffect, useContext } from 'react';
import Papa from 'papaparse';

export const DataContext = createContext(null);

const FILES = {
  upi:         '/data/upi_transactions_clean.csv',
  chargebacks: '/data/chargebacks_clean.csv',
  merchants:   '/data/merchants_clean.csv',
  kyc:         '/data/kyc_clean.csv',
};

const parseNum = (v) => {
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
};

const parseCsv = (url) =>
  new Promise((resolve, reject) => {
    Papa.parse(url, {
      download: true,
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      complete: ({ data }) => resolve(data),
      error: reject,
    });
  });

export const DataProvider = ({ children }) => {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all(
      Object.entries(FILES).map(async ([key, url]) => {
        const rows = await parseCsv(url);
        // Coerce numeric fields
        if (key === 'upi') {
          rows.forEach(r => { r.amount = parseNum(r.amount); });
        }
        if (key === 'chargebacks') {
          rows.forEach(r => { r.disputed_amount = parseNum(r.disputed_amount); });
        }
        if (key === 'kyc') {
          rows.forEach(r => { r.monthly_income = parseNum(r.monthly_income); });
        }
        return [key, rows];
      })
    )
      .then((entries) => {
        setData(Object.fromEntries(entries));
        setLoading(false);
      })
      .catch((e) => {
        setError('Failed to load data: ' + e.message);
        setLoading(false);
      });
  }, []);

  return (
    <DataContext.Provider value={{ data, loading, error }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
