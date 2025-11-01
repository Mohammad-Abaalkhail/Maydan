# Arabic Text Review - الميدان يا حميدان

## Review Guidelines

This document tracks Arabic text review for grammar, clarity, and consistency across the application.

---

## Login Page (`frontend/src/pages/Login.jsx`)

### Current Text
- Page title: "الميدان يا حميدان" ✅
- Username label: "اسم المستخدم" ✅
- Password label: "كلمة المرور" ✅
- Login button: "تسجيل الدخول" ✅
- Loading: "جاري تسجيل الدخول..." ✅
- Register link: "سجل الآن" ✅
- Placeholder: "أدخل اسم المستخدم" ✅
- Placeholder: "أدخل كلمة المرور" ✅

### Review Notes
- [ ] All text grammatically correct
- [ ] All text clear and understandable
- [ ] Consistent with rest of application
- [ ] Appropriate for target audience

### Suggestions
- _To be filled during QA review_

---

## Register Page (`frontend/src/pages/Register.jsx`)

### Current Text
- Page title: "إنشاء حساب جديد" ✅
- Username label: "اسم المستخدم" ✅
- Email label: "البريد الإلكتروني" ✅
- Password label: "كلمة المرور" ✅
- Confirm password: "تأكيد كلمة المرور" ✅
- Submit button: "إنشاء حساب" ✅
- Loading: "جاري التسجيل..." ✅
- Error: "كلمات المرور غير متطابقة" ✅
- Error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" ✅
- Login link: "سجل الدخول" ✅

### Review Notes
- [ ] All text grammatically correct
- [ ] Error messages clear and helpful
- [ ] Consistent terminology
- [ ] Appropriate tone

### Suggestions
- _To be filled during QA review_

---

## Lobby Page (`frontend/src/pages/Lobby.jsx`)

### Current Text
- Title: "الميدان يا حميدان" ✅
- Welcome: "مرحباً، {username}" ✅
- Connected: "● متصل" ✅
- Disconnected: "● غير متصل" ✅
- Logout: "تسجيل الخروج" ✅
- Create room: "إنشاء غرفة جديدة" ✅
- Creating: "جاري الإنشاء..." ✅
- Join by code: "الانضمام برمز" ✅
- Join button: "انضم" ✅
- Available rooms: "الغرف المتاحة" ✅
- No rooms: "لا توجد غرف متاحة حالياً" ✅
- Create first: "أنشئ غرفة جديدة للبدء" ✅
- Waiting: "في الانتظار" ✅
- Playing: "قيد اللعب" ✅
- Players: "{count} / {max} لاعب" ✅
- Loading: "جاري التحميل..." ✅

### Review Notes
- [ ] Connection status text appropriate
- [ ] Room state labels clear
- [ ] Action buttons clear
- [ ] Empty states helpful

### Suggestions
- _To be filled during QA review_

---

## Game Room Page (`frontend/src/pages/GameRoom.jsx`)

### Current Text
- Room header: "الغرفة: {code}" ✅
- Leave: "مغادرة الغرفة" ✅
- Players: "اللاعبون" ✅
- Your turn indicator: "👈" ✅
- Points: "النقاط: {progress} / {goal}" ✅
- Ready: "✓ جاهز" ✅
- Start game: "بدء اللعبة" ✅
- Min players: "عدد اللاعبين غير كافٍ ({count}/3)" ✅
- Power cards: "بطاقات القوة" ✅
- Skip turn: "تخطي الدور" ✅
- Double vote: "تصويت مزدوج" ✅
- Question: "السؤال" ✅
- Your answer: "إجابتك" ✅
- Answer placeholder: "اكتب إجابتك هنا..." ✅
- Submit answer: "تقديم الإجابة" ✅
- Voting: "التصويت" ✅
- From: "من: {player}" ✅
- Votes: "الأصوات: {accept} قبول / {reject} رفض" ✅
- Accept: "✓ قبول" ✅
- Reject: "✗ رفض" ✅
- Your cards: "بطاقاتك" ✅
- Waiting for start: "في انتظار بدء اللعبة..." ✅
- Min players required: "يجب أن يكون هناك 3 لاعبين على الأقل لبدء اللعبة" ✅
- Winner: "🎉 الفائز!" ✅
- Dice roll: "🎲 النرد: {value}" ✅
- Loading: "جاري التحميل..." ✅
- Room not found: "الغرفة غير موجودة" ✅

### Toast Messages
- "بدأت اللعبة!" ✅
- "تم تقديم إجابة من {player}" ✅
- "تم تطبيق التصويت المزدوج!" ✅
- "تم قبول الإجابة!" ✅
- "تم رفض الإجابة" ✅
- "🎉 فاز {player}!" ✅
- "غير متصل بالخادم" ✅
- "فشل بدء اللعبة" ✅
- "فشل تقديم الإجابة" ✅
- "فشل التصويت" ✅
- "فشل استخدام بطاقة القوة" ✅

### Review Notes
- [ ] Game state labels clear
- [ ] Turn indicators clear
- [ ] Power card labels appropriate
- [ ] Toast messages informative
- [ ] Error messages helpful

### Suggestions
- _To be filled during QA review_

---

## Error Messages (Backend Responses)

### Authentication Errors
- `E_AUTH_401`: "غير مصرح - Access token required"
- `E_AUTH_403`: "غير مصرح - Token expired or invalid"

### Room Errors
- `E_ROOM_FULL`: "الغرفة ممتلئة"
- `E_ROOM_NOT_FOUND`: "الغرفة غير موجودة"
- `E_ROOM_BAD_STATE`: "الغرفة في حالة غير صالحة"

### Game Errors
- `E_GAME_BAD_STATE`: "اللعبة في حالة غير صالحة"
- `E_GAME_NOT_TURN`: "ليس دورك"
- `E_VOTE_ALREADY_CAST`: "لقد صوّتت بالفعل"

### Power Card Errors
- `E_POWER_USED`: "تم استخدام بطاقة القوة بالفعل"
- `E_POWER_BAD_STATE`: "لا يمكن استخدام بطاقة القوة في هذه الحالة"
- `E_POWER_NOT_OWNER`: "أنت لست صاحب الدور"

### Review Notes
- [ ] Error messages clear and actionable
- [ ] Technical terms minimized
- [ ] Consistent tone
- [ ] Helpful to users

### Suggestions
- _To be filled during QA review_

---

## Common Issues to Check

### Grammar
- [ ] Proper use of تاء مربوطة vs تاء مفتوحة
- [ ] Proper use of همزة
- [ ] Proper use of أ vs إ
- [ ] Proper use of ال التعريف
- [ ] Proper verb conjugation

### Clarity
- [ ] Text is clear and unambiguous
- [ ] No confusing phrases
- [ ] Appropriate level of formality
- [ ] Consistent terminology

### Consistency
- [ ] Same terms used consistently
- [ ] Same style throughout
- [ ] Consistent capitalization (if any)
- [ ] Consistent punctuation

### Cultural Appropriateness
- [ ] Text appropriate for Kuwaiti audience
- [ ] No offensive or inappropriate language
- [ ] Culturally sensitive
- [ ] Respectful tone

---

## Review Checklist

### Phase 1: Grammar Review
- [ ] All Arabic text reviewed by native speaker
- [ ] Grammar errors corrected
- [ ] Spelling errors corrected
- [ ] Proper diacritics (if needed)

### Phase 2: Clarity Review
- [ ] All text clear and understandable
- [ ] No ambiguous phrases
- [ ] Error messages helpful
- [ ] Instructions clear

### Phase 3: Consistency Review
- [ ] Terminology consistent
- [ ] Style consistent
- [ ] Tone consistent
- [ ] Formatting consistent

### Phase 4: Cultural Review
- [ ] Appropriate for target audience
- [ ] Culturally sensitive
- [ ] No offensive language
- [ ] Respectful tone

---

## Notes

- All Arabic text is currently in source files
- Centralized text available in `frontend/src/utils/arabicText.js`
- Review should be done by native Arabic speaker
- Focus on Kuwaiti dialect appropriateness
- Consider gaming terminology conventions

---

**Status:** Ready for Arabic text review  
**Next:** Native speaker review and corrections

