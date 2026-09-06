import React from 'react';
import { useCart } from '../../context/CartContext';
import { ThermalPrintModal } from './ThermalPrintModal';

export const ThermalReceiptModal = () => {
  const { activeModal, closeModal, lastCompletedSale, cart, calculations, rxPatient } = useCart();

  if (activeModal !== 'thermal') return null;

  const sale = lastCompletedSale || {
    invoiceNo: '00000137',
    date: '2026-09-06',
    time: '2:57 am',
    cashierName: 'HASSAN SALEEM',
    customerName: rxPatient ? rxPatient.name : 'Customer Copy',
    items: (cart && cart.length > 0) ? cart : [
      { name: 'Myfol 400mcg tab 30s', qty: 10, unitSelection: 'Tablet', price: 19, boxPrice: 19 },
      { name: 'QSNATE-D TAB', qty: 10, unitSelection: 'Strip', price: 20, boxPrice: 20 },
      { name: 'SG INDROP-D 200000IU AMP', qty: 2, unitSelection: 'Ampoule', price: 313, boxPrice: 313 },
    ],
    subtotal: (cart && cart.length > 0) ? (calculations.subtotal || 0) : 1018,
    discountAmount: (cart && cart.length > 0) ? (calculations.discountAmount || 0) : 0,
    grossTotal: (cart && cart.length > 0) ? (calculations.subtotal || 0) : 1018,
    netTotal: (cart && cart.length > 0) ? (calculations.grandTotal || 0) : 1018,
    cashTendered: (cart && cart.length > 0) ? (calculations.grandTotal || 0) : 1018,
    changeDue: 0,
    fbrInvoiceNo: '19517326090625751354"'
  };

  return <ThermalPrintModal invoice={sale} onClose={closeModal} />;
};

export default ThermalReceiptModal;
