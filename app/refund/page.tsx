"use client";
import Link from "next/link";
export default function Refund() {
  return (
    <div className="container page-pad">
      <h2 className="title">💸 রিফান্ড পলিসি</h2>
      <div className="card" style={{ lineHeight: 2 }}>
        <h3>১. সাধারণ নিয়ম</h3>
        <p className="small">প্যাকেজ অ্যাক্টিভ হওয়ার পর রিফান্ড দেওয়া হয় না।</p>
        <h3>২. পেমেন্ট পেন্ডিং</h3>
        <p className="small">অ্যাডমিন অনুমোদনের আগে পেমেন্ট বাতিল করা যাবে।</p>
        <h3>৩. ভুল পেমেন্ট</h3>
        <p className="small">ভুল নম্বরে টাকা পাঠালে আমরা দায়ী নই। সঠিক নম্বর যাচাই করে পাঠান।</p>
        <h3>৪. যোগাযোগ</h3>
        <p className="small">রিফান্ড সংক্রান্ত যেকোনো বিষয়ে সাপোর্ট টিকিট খুলুন।</p>
      </div>
      <Link href="/" className="btn btn-outline">← ফিরে যান</Link>
    </div>
  );
}
