"use client";

import { useState } from "react";
import { createBooking, TenantInfo } from "@/lib/api/booking";
import { Button, Input, Label, Textarea } from "@/components/ui";

type PropertyMinimal = { _id: string; title?: string; price?: number };

export default function BookingFormModal({ property, onClose, onSuccess }: { property: PropertyMinimal; onClose: () => void; onSuccess?: (booking: any) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBook = async () => {
    if (!property) return;
    setError(null);
    if (!name || !phone) {
      setError('Please provide your name and phone');
      return;
    }

    setIsSubmitting(true);
    try {
      const tenantInfo: TenantInfo = { name, email, phone };

      const booking = await createBooking({ propertyId: property._id, message, tenantInfo });
      if (onSuccess) onSuccess(booking);
      onClose();
    } catch (e: any) {
      console.error(e);
      setError(e?.response?.data?.error || e?.message || 'Failed to create booking');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.55)',
        backdropFilter: 'blur(2px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 3000,
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 460,
          maxWidth: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-md)',
          padding: 'var(--space-6)',
        }}
      >
        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.01em' }}>
          Book: {property.title}
        </h3>
        <p style={{ margin: '6px 0 20px', color: 'var(--color-text-muted)', fontSize: 14 }}>
          Price: Rs {Number(property.price ?? 0).toLocaleString()}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <Label htmlFor="bk-name" required>Your name</Label>
            <Input id="bk-name" placeholder="Enter your name" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="bk-email">Email (optional)</Label>
            <Input id="bk-email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="bk-phone" required>Phone</Label>
            <Input id="bk-phone" placeholder="98XXXXXXXX" value={phone} onChange={e => setPhone(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="bk-message">Message (optional)</Label>
            <Textarea id="bk-message" placeholder="Anything you'd like the host to know?" value={message} onChange={e => setMessage(e.target.value)} />
          </div>
        </div>

        {error && (
          <div style={{ marginTop: 14, background: 'var(--color-error-soft)', color: 'var(--color-error)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', fontSize: 14 }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
          <Button variant="secondary" onClick={onClose} style={{ flex: 1 }}>Cancel</Button>
          <Button variant="primary" onClick={handleBook} disabled={isSubmitting} style={{ flex: 1 }}>
            {isSubmitting ? 'Booking…' : 'Book'}
          </Button>
        </div>
      </div>
    </div>
  );
}
