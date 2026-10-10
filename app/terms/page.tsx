"use client";
import Link from "next/link";
export default function Terms() {
  return (
    <div className="container page-pad">
      <h2 className="title">📜 শর্তাবলী</h2>
      <div className="card" style={{ lineHeight: 2 }}>
        <h3>১. সেবার বিবরণ</h3>
        <p className="small">WedGo একটি ম্যাট্রিমনি প্ল্যাটফর্ম। সদস্যরা প্রোফাইল তৈরি করে, মেসেজ ও কল করতে পারবে।</p>
        <h3>২. সদস্যের দায়িত্ব</h3>
        <p className="small">সত্য তথ্য দিতে হবে। ভুয়া প্রোফাইল নিষিদ্ধ। ১৮+ বয়স হতে হবে।</p>
        <h3>৩. পেমেন্ট</h3>
        <p className="small">প্যাকেজ কেনার পর রিফান্ড নেই (Refund Policy দেখুন)।</p>
        <h3>৪. আচরণবিধি</h3>
        <p className="small">অশালীন আচরণ, প্রতারণা, স্প্যাম করলে অ্যাকাউন্ট সাসপেন্ড/ব্যান হবে।</p>
        <h3>৫. গোপনীয়তা</h3>
        <p className="small">আপনার তথ্য Privacy Policy অনুযায়ী সুরক্ষিত।</p>
      </div>
      <Link href="/" className="btn btn-outline">← ফিরে যান</Link>
    </div>
  );
}
