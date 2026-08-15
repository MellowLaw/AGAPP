'use client';

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { InfoCircle } from 'iconsax-react';
import { getLguLogo } from '../../contexts/LguContext';

interface OfficialTransactionReceiptProps {
  lgu: any;
  transaction: {
    referenceNumber: string;
    type: 'service' | 'report';
    title: string;
    applicantName?: string;
    barangay?: string;
    dateFiled: string;
    status: string;
    officeName?: string;
    targetRelease?: string;
    amount?: string | number;
    description?: string;
    claimCode?: string;
  };
}

export function OfficialTransactionReceipt({ lgu, transaction }: OfficialTransactionReceiptProps) {
  const lguName = lgu?.name?.replace(/^municipality of\s*/i, '') || 'Liliw';
  const logoUrl = getLguLogo(lgu);
  const isReport = transaction.type === 'report';

  return (
    <div id="official-receipt-print-area" className="w-full bg-white text-black p-8 sm:p-10 font-sans border-2 border-stone-800 rounded-2xl shadow-xl max-w-2xl mx-auto my-4 print:my-0 print:border-none print:shadow-none print:p-4 print:max-w-full">
      {/* Official Government Letterhead Header */}
      <div className="flex items-center justify-between border-b-2 border-stone-800 pb-5 gap-4">
        <div className="w-20 h-20 shrink-0 overflow-hidden flex items-center justify-center">
          <img
            src={logoUrl}
            alt={`${lguName} Seal`}
            className="w-full h-full object-contain"
          />
        </div>

        <div className="text-center flex-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-stone-600 leading-tight">
            Republic of the Philippines
          </p>
          <p className="text-xs font-bold uppercase tracking-wide text-stone-700 leading-tight">
            Province of Laguna
          </p>
          <h2 className="text-base sm:text-lg font-black uppercase text-stone-950 tracking-tight leading-tight mt-0.5">
            Municipality of {lguName}
          </h2>
          <p className="text-[10px] font-semibold uppercase text-stone-600 tracking-wider mt-0.5">
            {transaction.officeName || (isReport ? 'Municipal Disaster Risk Reduction & Safety Office' : 'Office of the Municipal Mayor · Citizen Service Portal')}
          </p>
        </div>

        <div className="w-20 h-20 shrink-0 overflow-hidden flex items-center justify-center">
          <img
            src="/brand/logo.png"
            alt="AGAPP System Logo"
            className="w-16 h-16 object-contain"
          />
        </div>
      </div>

      {/* Document Classification Banner */}
      <div className="bg-stone-900 text-white text-center py-2 px-4 my-5 rounded-lg">
        <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider">
          {isReport ? 'Official Community Incident Report Stub' : 'Official Electronic Transaction Stub & Claim Receipt'}
        </h3>
        <p className="text-[9.5px] text-stone-300 font-mono tracking-widest mt-0.5">
          TRANSACTION REFERENCE: #{transaction.referenceNumber}
        </p>
      </div>

      {/* QR Code & Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center p-4 bg-stone-50 border border-stone-300 rounded-xl mb-6">
        <div className="sm:col-span-2 space-y-2 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-stone-500 block">Service / Transaction</span>
            <span className="text-sm font-bold text-stone-950 block">{transaction.title}</span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <span className="text-[10px] uppercase font-bold text-stone-500 block">Date & Time Filed</span>
              <span className="font-semibold text-stone-800">{new Date(transaction.dateFiled).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-stone-500 block">Current Status</span>
              <span className="inline-block font-bold text-stone-900 bg-stone-200 px-2 py-0.5 rounded text-[11px] uppercase">
                {transaction.status}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center p-2 bg-white border border-stone-200 rounded-xl shadow-xs">
          <QRCodeSVG
            value={`AGAPP:${transaction.type.toUpperCase()}:${transaction.referenceNumber}:${transaction.claimCode || transaction.referenceNumber}`}
            size={110}
            level="M"
          />
          <span className="text-[9px] font-mono font-bold text-stone-600 mt-1">
            SCAN TO VERIFY
          </span>
        </div>
      </div>

      {/* Details Table */}
      <div className="border border-stone-300 rounded-xl overflow-hidden mb-6 text-xs">
        <div className="bg-stone-100 px-4 py-2 border-b border-stone-300 font-bold uppercase text-[10px] text-stone-700 tracking-wider">
          Transaction & Applicant Particulars
        </div>
        <table className="w-full divide-y divide-stone-200 text-left">
          <tbody className="divide-y divide-stone-200">
            <tr>
              <td className="px-4 py-2.5 font-bold text-stone-600 w-1/3 bg-stone-50/50">Applicant / Citizen:</td>
              <td className="px-4 py-2.5 font-semibold text-stone-900">{transaction.applicantName || 'Registered Citizen'}</td>
            </tr>
            <tr>
              <td className="px-4 py-2.5 font-bold text-stone-600 bg-stone-50/50">Barangay / Municipality:</td>
              <td className="px-4 py-2.5 font-semibold text-stone-900">{transaction.barangay ? `Brgy. ${transaction.barangay}, ${lguName}` : `${lguName}, Laguna`}</td>
            </tr>
            <tr>
              <td className="px-4 py-2.5 font-bold text-stone-600 bg-stone-50/50">Processing Office:</td>
              <td className="px-4 py-2.5 font-semibold text-stone-900">{transaction.officeName || 'Municipal Operations Division'}</td>
            </tr>
            {!isReport && (
              <>
                <tr>
                  <td className="px-4 py-2.5 font-bold text-stone-600 bg-stone-50/50">Target Release SLA:</td>
                  <td className="px-4 py-2.5 font-semibold text-stone-900">{transaction.targetRelease || '2–3 Working Days (R.A. 11032)'}</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-bold text-stone-600 bg-stone-50/50">Statutory Fee / Assessment:</td>
                  <td className="px-4 py-2.5 font-bold text-emerald-800">{transaction.amount ? `₱${transaction.amount}` : 'FREE / STANDARD MUNICIPAL CLEARANCE'}</td>
                </tr>
              </>
            )}
            {isReport && transaction.description && (
              <tr>
                <td className="px-4 py-2.5 font-bold text-stone-600 bg-stone-50/50">Report Statement:</td>
                <td className="px-4 py-2.5 text-stone-800 text-[11px] leading-relaxed">{transaction.description}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Claim Instructions */}
      <div className="p-4 bg-stone-100/70 border border-stone-200 rounded-xl space-y-1 text-[10.5px] text-stone-700 leading-relaxed mb-6">
        <span className="font-bold uppercase text-stone-900 text-[10px] flex items-center gap-1.5 mb-1">
          <InfoCircle variant="Bold" className="w-3.5 h-3.5 text-stone-700 shrink-0" />
          <span>Important Claim &amp; Verification Guidelines:</span>
        </span>
        <p>1. <strong>Presentation of Stub:</strong> Present this printed receipt or digital copy on your smartphone to the Municipal Releasing Officer / Cashier.</p>
        <p>2. <strong>Identity Verification:</strong> Bring at least one (1) valid government-issued ID matching the registered applicant name.</p>
        <p>3. <strong>Physical Requirements Check:</strong> You MUST present the original copies and photocopies of all required application documents upon claiming.</p>
        <p>4. <strong>Anti-Fraud Protection:</strong> Keep the QR barcode intact and unblemished. Alteration or forgery of this stub is punishable under the Revised Penal Code.</p>
      </div>

      {/* Legal & System Certification Footer */}
      <div className="border-t border-dashed border-stone-400 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-[9px] text-stone-500 font-mono">
        <div>
          <span>SYSTEM CERTIFIED: AGAPP v1.0.0 · R.A. 8792 E-COMMERCE COMPLIANT</span>
          <br />
          <span>TIMESTAMP: {new Date().toISOString()} · PHT</span>
        </div>
        <div className="text-right">
          <span className="font-bold text-stone-700">ELECTRONICALLY GENERATED</span>
          <br />
          <span>NO PHYSICAL SIGNATURE REQUIRED</span>
        </div>
      </div>
    </div>
  );
}
