"use client";
import Link from "next/link";
export default function Privacy() {
  return (
    <div className="container page-pad">
      <h2 className="title">🔒 প্রাইভেসি পলিসি</h2>
      <div className="card" style={{ lineHeight: 2 }}>
        <h3>১. সংগৃহীত তথ্য</h3>
        <p className="small">নাম, মোবাইল, ইমেইল, প্রোফাইল তথ্য ও ছবি সংগ্রহ করি।</p>
        <h3>২. তথ্যের ব্যবহার</h3>
        <p className="small">শুধুমাত্র ম্যাচিং ও সেবা প্রদানে ব্যবহার হয়। তৃতীয় পক্ষের কাছে বিক্রি করা হয় না।</p>
        <h3>৩. চ্যাটের গোপনীয়তা</h3>
        <p className="small">আপনার চ্যাট অ্যাডমিন দেখতে পারে না। শুধু রিপোর্ট হলে পর্যালোচনা হয়।</p>
        <h3>৪. তথ্য মুছে ফেলা</h3>
        <p className="small">অ্যাকাউন্ট মুছতে সাপোর্টে যোগাযোগ করুন।</p>
      </div>
      <Link href="/" className="btn btn-outline">← ফিরে যান</Link>
    </div>
  );
}
