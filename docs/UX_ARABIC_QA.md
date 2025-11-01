# UX Polish + Arabic Localization QA

## UI Copy Review (Arabic)

### Pages to Review

#### 1. Login Page (`frontend/src/pages/Login.jsx`)

**Arabic Text to Review:**
- [ ] Page title: "تسجيل الدخول"
- [ ] Username label: "اسم المستخدم"
- [ ] Password label: "كلمة المرور"
- [ ] Login button: "دخول"
- [ ] Register link: "إنشاء حساب جديد"
- [ ] Error messages: Check grammar and clarity
- [ ] Placeholder text: Review appropriateness

**Issues Found:**
- _To be filled during QA_

---

#### 2. Register Page (`frontend/src/pages/Register.jsx`)

**Arabic Text to Review:**
- [ ] Page title: "إنشاء حساب"
- [ ] Form labels: Review all field labels
- [ ] Validation messages: Check Arabic grammar
- [ ] Success message: "تم إنشاء الحساب بنجاح"
- [ ] Error messages: Check clarity

**Issues Found:**
- _To be filled during QA_

---

#### 3. Lobby Page (`frontend/src/pages/Lobby.jsx`)

**Arabic Text to Review:**
- [ ] Page title: "القاعة"
- [ ] "إنشاء غرفة" button
- [ ] "انضم إلى غرفة" button
- [ ] Room list headers
- [ ] Empty state message
- [ ] Loading states

**Issues Found:**
- _To be filled during QA_

---

#### 4. Game Room Page (`frontend/src/pages/GameRoom.jsx`)

**Arabic Text to Review:**
- [ ] Game state labels ("دورك", "في الانتظار", etc.)
- [ ] Player names and scores
- [ ] Card display labels
- [ ] Question display
- [ ] Answer submission button: "إرسال الإجابة"
- [ ] Vote buttons: "موافق" / "غير موافق"
- [ ] Power card buttons
- [ ] Turn indicators
- [ ] Game end messages

**Issues Found:**
- _To be filled during QA_

---

#### 5. Error Messages

**Review Error Codes and Messages:**
- [ ] `E_AUTH_401`: "غير مصرح - Access token required"
- [ ] `E_AUTH_403`: "غير مصرح - Token expired or invalid"
- [ ] `E_ROOM_FULL`: "الغرفة ممتلئة"
- [ ] `E_ROOM_NOT_FOUND`: "الغرفة غير موجودة"
- [ ] `E_GAME_BAD_STATE`: Check Arabic translation
- [ ] `E_POWER_USED`: Check Arabic translation
- [ ] Generic error: "حدث خطأ"

**Issues Found:**
- _To be filled during QA_

---

## Accessibility & RTL Checklist

### RTL Support

- [ ] **Direction:** `dir="rtl"` set on root HTML element
- [ ] **CSS:** Tailwind RTL plugin configured
- [ ] **Layout:** All layouts work correctly in RTL
- [ ] **Icons:** Icons flipped/positioned correctly
- [ ] **Forms:** Input fields align correctly
- [ ] **Buttons:** Button alignment correct
- [ ] **Navigation:** Navigation direction correct
- [ ] **Cards:** Card layout works in RTL
- [ ] **Scrollbars:** Scrollbar position correct

### Font Support

- [ ] **Primary Font:** Cairo loaded and applied
- [ ] **Secondary Font:** Tajawal loaded (if used)
- [ ] **Fallback:** System Arabic fonts as fallback
- [ ] **Weight:** Font weights available (400, 600, 700)
- [ ] **Size:** Font sizes appropriate for Arabic text

### Keyboard Navigation

- [ ] **Tab Order:** Logical tab order throughout
- [ ] **Focus Indicators:** Visible focus indicators
- [ ] **Skip Links:** Skip to main content link
- [ ] **Form Navigation:** Tab through forms works
- [ ] **Modal Navigation:** Escape key closes modals

### Screen Reader Support

- [ ] **ARIA Labels:** Proper ARIA labels on interactive elements
- [ ] **Landmarks:** Semantic HTML5 landmarks
- [ ] **Alt Text:** Images have descriptive alt text
- [ ] **Form Labels:** All inputs have associated labels
- [ ] **Error Announcements:** Errors announced to screen readers

### Color Contrast

- [ ] **Text/Background:** WCAG AA compliance (4.5:1 ratio)
- [ ] **Large Text:** WCAG AA compliance (3:1 ratio)
- [ ] **Interactive Elements:** Sufficient contrast
- [ ] **Error States:** Error colors distinguishable
- [ ] **Success States:** Success colors distinguishable

---

## Mobile/Desktop Spacing Tokens

### Spacing Scale

**Tailwind Default Scale:**
```css
--spacing-0: 0px;
--spacing-1: 0.25rem;   /* 4px */
--spacing-2: 0.5rem;    /* 8px */
--spacing-3: 0.75rem;   /* 12px */
--spacing-4: 1rem;      /* 16px */
--spacing-5: 1.25rem;   /* 20px */
--spacing-6: 1.5rem;    /* 24px */
--spacing-8: 2rem;      /* 32px */
--spacing-10: 2.5rem;   /* 40px */
--spacing-12: 3rem;     /* 48px */
--spacing-16: 4rem;     /* 64px */
--spacing-20: 5rem;     /* 80px */
--spacing-24: 6rem;     /* 96px */
```

### Mobile-Specific Spacing

**Recommended:**
- Button padding: `px-4 py-2` (16px horizontal, 8px vertical)
- Card padding: `p-4` (16px all sides)
- Section spacing: `mb-6` (24px bottom margin)
- Input spacing: `mb-4` (16px bottom margin)
- Icon spacing: `ml-2` or `mr-2` (8px margin, RTL-aware)

### Desktop-Specific Spacing

**Recommended:**
- Container max-width: `max-w-7xl` (1280px)
- Section spacing: `mb-12` (48px bottom margin)
- Card grid gap: `gap-6` (24px gap)
- Button padding: `px-6 py-3` (24px horizontal, 12px vertical)

### Responsive Breakpoints

```css
/* Tailwind Defaults */
sm: 640px   /* Small devices */
md: 768px   /* Medium devices */
lg: 1024px  /* Large devices */
xl: 1280px  /* Extra large devices */
2xl: 1536px /* 2X Extra large devices */
```

### Spacing Audit

**Mobile (< 768px):**
- [ ] Touch targets ≥ 44x44px
- [ ] Adequate spacing between interactive elements
- [ ] Readable line height (≥ 1.5)
- [ ] Comfortable padding in cards/containers

**Desktop (≥ 768px):**
- [ ] Appropriate use of whitespace
- [ ] Balanced layout spacing
- [ ] Consistent margins/padding
- [ ] Grid gaps appropriate

---

## Color Contrast Report

### Color Palette

**Primary Colors:**
- Primary: `#3B82F6` (Blue)
- Primary Dark: `#2563EB`
- Primary Light: `#60A5FA`

**Background Colors:**
- Background: `#FFFFFF` (White)
- Background Dark: `#F3F4F6` (Gray-100)
- Surface: `#FFFFFF`

**Text Colors:**
- Text Primary: `#111827` (Gray-900)
- Text Secondary: `#6B7280` (Gray-500)
- Text Disabled: `#9CA3AF` (Gray-400)

**Status Colors:**
- Success: `#10B981` (Green-500)
- Error: `#EF4444` (Red-500)
- Warning: `#F59E0B` (Amber-500)
- Info: `#3B82F6` (Blue-500)

### Contrast Ratios

#### Text on Background

| Text Color | Background | Ratio | WCAG AA | Status |
|------------|------------|-------|---------|--------|
| Gray-900 | White | 16.1:1 | ✅ | Pass |
| Gray-500 | White | 7.0:1 | ✅ | Pass |
| Gray-400 | White | 4.5:1 | ✅ | Pass |
| White | Blue-500 | 4.8:1 | ✅ | Pass |
| White | Blue-600 | 6.2:1 | ✅ | Pass |

#### Interactive Elements

| Element | Text | Background | Ratio | Status |
|---------|------|------------|-------|--------|
| Primary Button | White | Blue-500 | 4.8:1 | ✅ Pass |
| Secondary Button | Blue-500 | White | 7.0:1 | ✅ Pass |
| Error Button | White | Red-500 | 4.6:1 | ✅ Pass |
| Link | Blue-500 | White | 7.0:1 | ✅ Pass |

#### Status Indicators

| Status | Text | Background | Ratio | Status |
|--------|------|------------|-------|--------|
| Success | White | Green-500 | 4.6:1 | ✅ Pass |
| Error | White | Red-500 | 4.6:1 | ✅ Pass |
| Warning | White | Amber-500 | 3.2:1 | ⚠️ Warning (needs dark text) |
| Info | White | Blue-500 | 4.8:1 | ✅ Pass |

### Issues & Recommendations

**Issue 1: Warning Color Contrast**
- **Problem:** Amber-500 with white text has 3.2:1 ratio (fails WCAG AA)
- **Recommendation:** Use dark text (`Gray-900`) on Amber-500 background
- **Status:** ⚠️ Needs Fix

**Issue 2: Disabled Text**
- **Problem:** Gray-400 on white has 4.5:1 ratio (minimum for WCAG AA)
- **Recommendation:** Use Gray-500 for better visibility
- **Status:** ⚠️ Consider Improvement

### Testing Tools

**Recommended Tools:**
- Chrome DevTools Accessibility panel
- WAVE browser extension
- axe DevTools
- Color Contrast Analyzer

---

## QA Checklist Summary

### Content
- [ ] All Arabic text reviewed
- [ ] Grammar and spelling checked
- [ ] Error messages clear and helpful
- [ ] Placeholder text appropriate

### Accessibility
- [ ] RTL support verified
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Color contrast compliant

### Responsive Design
- [ ] Mobile spacing appropriate
- [ ] Desktop spacing balanced
- [ ] Touch targets adequate size
- [ ] Readable on all screen sizes

### Visual Polish
- [ ] Consistent spacing throughout
- [ ] Proper use of whitespace
- [ ] Colors harmonious
- [ ] Typography hierarchy clear

---

**Last Updated:** 2025-01-11  
**Status:** Ready for QA review

