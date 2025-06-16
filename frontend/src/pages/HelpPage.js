// D:\intelligent translator\frontend\src\pages\HelpPage.js
// تم تصحيح مسار استيراد ملف الأنماط في هذا الملف.

import React from 'react';
// المسار الصحيح يجب أن يبدأ بالرجوع للخلف من مجلد pages ثم الدخول إلى assets
import '../assets/styles/pages/_help-page.scss'; 

const HelpPage = () => {
  const helpSections = [
    {
      title: "1. ضبط الإعدادات الأساسية",
      items: [
        {
          heading: "مفتاح OpenAI API:",
          points: [
            "توجه إلى قسم 'الإعدادات' في الشريط الجانبي.",
            "اختر 'إدارة مفتاح API' وأدخل المفتاح الخاص بك من OpenAI.",
            "هذا المفتاح ضروري لعمليات الترجمة، الصوت، والنسخ."
          ]
        },
        {
          heading: "نماذج الذكاء الاصطناعي:",
          points: [
            "من 'إعدادات النماذج'، يمكنك اختيار نموذج الترجمة (مثل GPT-4o mini للسرعة أو GPT-4o للدقة).",
            "يمكنك أيضاً اختيار جودة الصوت (TTS) والصوت المفضل."
          ]
        },
        {
            heading: "المحفز الافتراضي (Default Prompt):",
            points: [
              "من 'إدارة البرومبتات'، يمكنك إنشاء محفزات مخصصة وتعيين واحد منها كافتراضي للمحادثات الجديدة."
            ]
        }
      ]
    },
    {
      title: "2. استخدام البرنامج",
      items: [
        {
          heading: "بدء محادثة جديدة:",
          points: [
            "من صفحة 'المحادثات'، اكتب عنواناً وانقر 'إنشاء' لبدء جلسة جديدة."
          ]
        },
        {
          heading: "الترجمة وتحويل الصوت:",
          points: [
            "اكتب أو الصق النص واضغط على زر الإرسال للترجمة.",
            "اضغط باستمرار على أيقونة الميكروفون لتسجيل الصوت وتحويله إلى نص.",
            "انقر على أيقونة مشبك الورق لرفع ملف صوتي وترجمته."
          ]
        },
        {
            heading: "القاموس المخصص:",
            points: [
              "في الإعدادات، استخدم 'القاموس المخصص' لإضافة ترجمات ثابتة لمصطلحات معينة، مما يجبر المترجم على استخدامها دائماً."
            ]
        },
        {
            heading: "الملاحظات (Notes):",
            points: [
              "قريبًا: ستتمكن من إضافة ملاحظات خاصة لكل محادثة من داخل صفحة المحادثة."
            ]
        }
      ]
    }
  ];

  return (
    <div className="page-container help-page">
      <div className="help-header">
        <h1>المساعدة والتعليمات</h1>
        <p>دليلك للاستفادة القصوى من المترجم الذكي.</p>
      </div>
      
      <div className="help-content">
        {helpSections.map((section, index) => (
          <div className="help-card" key={index}>
            <h2>{section.title}</h2>
            {section.items.map((item, itemIndex) => (
              <div className="help-item" key={itemIndex}>
                <h3>{item.heading}</h3>
                <ul>
                  {item.points.map((point, pointIndex) => (
                    <li key={pointIndex}>{point}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ))}
      </div>

      <footer className="help-footer">
        <p>تطوير ليث رافع - 2025</p>
        <p>Developed for Al-Tahreer NGO</p>
      </footer>
    </div>
  );
};

export default HelpPage;