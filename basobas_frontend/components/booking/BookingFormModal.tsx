"use client";

import { useState } from "react";
import { createBooking, TenantInfo, PaymentInfo } from "@/lib/api/booking";

type PropertyMinimal = { _id: string; title?: string; price?: number };

export default function BookingFormModal({ property, onClose, onSuccess }: { property: PropertyMinimal; onClose: () => void; onSuccess?: (booking: any) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [isPaying, setIsPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const convertToNpr = async (amountUsd: number) => {
    try {
      const res = await fetch(`https://api.exchangerate.host/convert?from=USD&to=NPR&amount=${amountUsd}`);
      const data = await res.json();
      if (data && typeof data.result === 'number') return data.result as number;
    } catch (e) {
      console.error('FX error', e);
    }
    // fallback: use a reasonable default but not hard-coded 135/140 — use 137
    return Number((amountUsd * 137).toFixed(0));
  };

  const handlePayAndBook = async () => {
    if (!property) return;
    setError(null);
    if (!name || !phone) {
      setError('Please provide your name and phone');
      return;
    }

    setIsPaying(true);
    try {
      const priceUsd = Number(property.price || 0);
      const amountNpr = await convertToNpr(priceUsd);

      // Simulate Khalti-like payment flow (demo)
      const txnId = `demo-khalti-${Date.now()}`;
      const payment: PaymentInfo = {
        method: 'khalti-demo',
        amount: amountNpr,
        currency: 'NPR',
        status: 'success',
        transactionId: txnId,
        meta: { phone }
      };

      const tenantInfo: TenantInfo = { name, email, phone };

      const booking = await createBooking({ propertyId: property._id, message, tenantInfo, payment });
      if (onSuccess) onSuccess(booking);
      onClose();
    } catch (e: any) {
      console.error(e);
      setError(e?.response?.data?.error || e?.message || 'Failed to create booking');
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000 }}>
      <div style={{ width: 420, maxWidth: '96%', background: '#fff', borderRadius: 12, padding: 18 }}>
        <h3 style={{ margin: 0, marginBottom: 8 }}>Book: {property.title}</h3>
        <p style={{ marginTop: 0, color: '#64748b', fontSize: 13 }}>Price: Rs {Number(property.price ?? 0).toLocaleString()}</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input placeholder="Your name" value={name} onChange={e => setName(e.target.value)} style={{ padding: 10, borderRadius: 8, border: '1px solid #e6eaf7' }} />
          <input placeholder="Email (optional)" value={email} onChange={e => setEmail(e.target.value)} style={{ padding: 10, borderRadius: 8, border: '1px solid #e6eaf7' }} />
          <input placeholder="Phone" value={phone} onChange={e => setPhone(e.target.value)} style={{ padding: 10, borderRadius: 8, border: '1px solid #e6eaf7' }} />
          <textarea placeholder="Message (optional)" value={message} onChange={e => setMessage(e.target.value)} style={{ padding: 10, borderRadius: 8, border: '1px solid #e6eaf7' }} />
        </div>

        {error && <div style={{ color: '#ef4444', marginTop: 8 }}>{error}</div>}

        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px 12px', borderRadius: 8, background: '#f3f4f6', border: 'none', cursor: 'pointer' }}>Cancel</button>
          <button onClick={handlePayAndBook} disabled={isPaying} style={{ flex: 1, padding: '10px 12px', borderRadius: 8, background: '#4f46e5', color: '#fff', border: 'none', cursor: isPaying ? 'not-allowed' : 'pointer' }}>{isPaying ? 'Processing...' : 'Pay & Book'}</button>
        </div>
      </div>
    </div>
  );
}
