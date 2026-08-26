"use client";

import {
  useMemo,
  useState,
  useCallback,
  Suspense,
  useEffect,
  useRef,
} from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { useDeliveryAreas } from "@/hooks/use-delivery-areas";
import { useDiscountConfig } from "@/hooks/use-discount-config";
import { useOrderScheduleConfig } from "@/hooks/use-order-schedule-config";
import { resolveDiscount } from "@/lib/discounts";
import {
  generateWhatsAppMessage,
  generatePickupWhatsAppMessage,
  WHATSAPP_NUMBER,
} from "@/lib/data";
import {
  generateDeliveryDaySlots,
  isSaudiDateClosed,
} from "@/lib/checkout-schedule";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DeliveryFlowEditorial } from "@/components/checkout-flow-editorial";

type CheckoutErrors = {
  name?: string;
  phone?: string;
  area?: string;
  scheduledTime?: string;
};
type OrderMode = "pickup" | "delivery";
type CouponStatusTone = "success" | "error" | "info";
type CheckoutIssueTone = "warning" | "error";

const PREFERRED_ORDER_TYPE_KEY = "amal_preferred_order_type";
const CHECKOUT_EVENTS_KEY = "amal_checkout_events";
const DELIVERY_BUFFER_MINUTES = 120;

function normalizeSaudiPhoneDigits(value: string): string {
  let digits = value.replace(/\D/g, "");

  if (digits.startsWith("00966")) digits = `0${digits.slice(5)}`;
  if (digits.startsWith("966")) digits = `0${digits.slice(3)}`;
  if (!digits.startsWith("0") && digits.length === 9) digits = `0${digits}`;

  return digits.slice(0, 10);
}

function formatSaudiPhoneInput(value: string): string {
  const digits = normalizeSaudiPhoneDigits(value);

  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
}

function trackCheckoutEvent(
  event: string,
  details: Record<string, boolean | number | string | null> = {},
) {
  if (typeof window === "undefined") return;

  try {
    const raw = window.localStorage.getItem(CHECKOUT_EVENTS_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    const existing = Array.isArray(parsed) ? parsed : [];
    const next = [
      ...existing.slice(-39),
      {
        event,
        details,
        timestamp: new Date().toISOString(),
      },
    ];

    window.localStorage.setItem(CHECKOUT_EVENTS_KEY, JSON.stringify(next));
  } catch {
    // Local funnel tracking is best-effort only.
  }
}

function scrollToSection(node: HTMLElement | null) {
  if (!node) return;
  node.scrollIntoView({ behavior: "smooth", block: "start" });
}

function isLikelyIOSDevice() {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/i.test(navigator.userAgent);
}

function renderWhatsAppHandoffWindow(
  popup: Window,
  state: "saving" | "opening" | "error",
  whatsappUrl?: string,
) {
  const content =
    state === "saving"
      ? {
          title: "جاري حفظ الطلب",
          description: "سنفتح واتساب مباشرة بعد حفظ الطلب.",
          badge: "الخطوة 1 من 2",
          action: "",
          statusClass: "is-saving",
        }
      : state === "opening"
        ? {
            title: "تم حفظ الطلب",
            description:
              "جاري فتح واتساب الآن. إذا لم ينتقل تلقائيًا، استخدم الزر بالأسفل.",
            badge: "الخطوة 2 من 2",
            action: whatsappUrl
              ? `<a class="action" href="${whatsappUrl}">فتح واتساب يدويًا</a>`
              : "",
            statusClass: "is-opening",
          }
        : {
            title: "تعذر حفظ الطلب",
            description: "حدثت مشكلة أثناء الحفظ. ارجع للمتجر وحاول مرة أخرى.",
            badge: "لم يكتمل الطلب",
            action: "",
            statusClass: "is-error",
          };

  popup.document.write(`
    <!doctype html>
    <html lang="ar" dir="rtl">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>حالة الطلب</title>
        <style>
          body {
            margin: 0;
            min-height: 100vh;
            display: grid;
            place-items: center;
            background:
              radial-gradient(circle at top, rgba(37, 211, 102, 0.12), transparent 32%),
              linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%);
            color: #0f172a;
            font-family: system-ui, sans-serif;
          }
          .card {
            width: min(30rem, calc(100vw - 2rem));
            background: rgba(255, 255, 255, 0.92);
            border: 1px solid rgba(148, 163, 184, 0.18);
            border-radius: 28px;
            padding: 28px;
            box-shadow: 0 20px 40px rgba(15, 23, 42, 0.12);
            text-align: center;
            backdrop-filter: blur(14px);
          }
          .badge {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-height: 2rem;
            padding: 0 0.85rem;
            border-radius: 999px;
            background: rgba(15, 23, 42, 0.06);
            color: #334155;
            font-size: 0.8rem;
            font-weight: 700;
          }
          .indicator {
            width: 54px;
            height: 54px;
            margin: 18px auto 16px;
            border-radius: 999px;
            display: grid;
            place-items: center;
            font-size: 1.2rem;
            font-weight: 800;
          }
          .is-saving .indicator {
            border: 3px solid #d1d5db;
            border-top-color: #25d366;
            animation: spin 0.9s linear infinite;
          }
          .is-opening .indicator {
            background: rgba(34, 197, 94, 0.12);
            color: #15803d;
          }
          .is-opening .indicator::before {
            content: "✓";
          }
          .is-error .indicator {
            background: rgba(239, 68, 68, 0.12);
            color: #b91c1c;
          }
          .is-error .indicator::before {
            content: "!";
          }
          h1 {
            margin: 0;
            font-size: 1.5rem;
          }
          p {
            margin: 0.75rem 0 0;
            color: #475569;
            line-height: 1.7;
          }
          .action {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-height: 3rem;
            margin-top: 1.5rem;
            padding: 0 1.2rem;
            border-radius: 999px;
            background: #25d366;
            color: white;
            font-weight: 800;
            text-decoration: none;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        </style>
      </head>
      <body>
        <div class="card ${content.statusClass}">
          <div class="badge">${content.badge}</div>
          <div class="indicator"></div>
          <h1>${content.title}</h1>
          <p>${content.description}</p>
          ${content.action}
        </div>
      </body>
    </html>
  `);
  popup.document.close();
}

void renderWhatsAppHandoffWindow;

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeMakingTimeMinutes(value: number): number {
  if (!value || value <= 0) return 0;
  return value;
}

function CheckoutContent() {
  const searchParams = useSearchParams();
  const orderTypeParam = searchParams.get("type");
  const orderType = (orderTypeParam as OrderMode) || "delivery";
  const isPickup = orderType === "pickup";
  const theme = {
    main: "min-h-screen bg-background pb-24 text-foreground",
    header:
      "sticky top-0 z-50 border-b border-border/80 bg-background/90 backdrop-blur-md",
    section:
      "rounded-[20px] border border-border bg-card p-4 shadow-[0_4px_20px_rgba(15,23,42,0.05)]",
    summary:
      "rounded-[24px] border border-accent/40 bg-accent/15 p-5 shadow-[0_4px_20px_rgba(236,91,19,0.05)]",
    input: "bg-muted",
    ctaWrap: "mx-auto w-full max-w-md px-4 pb-8 pt-2",
  };

  const router = useRouter();
  const { items, totalPrice, deliveryInfo, setDeliveryInfo, clearCart } =
    useCart();
  const { areas: deliveryAreas } = useDeliveryAreas();
  const { config: discountConfig } = useDiscountConfig();
  const { config: orderScheduleConfig } = useOrderScheduleConfig();
  const areaSectionRef = useRef<HTMLElement | null>(null);
  const detailsSectionRef = useRef<HTMLElement | null>(null);
  const scheduleSectionRef = useRef<HTMLElement | null>(null);
  const schedulePickerRef = useRef<HTMLDivElement | null>(null);
  const previousRevealStateRef = useRef(true);
  const previousInfoDoneRef = useRef(false);
  const previousCheckoutSnapshotRef = useRef<string | null>(null);
  const animatedTotalRef = useRef<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<CheckoutErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [, setAreaFocused] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [, setIsSchedulePickerHighlighted] = useState(false);
  const [schedulePickerOpenSignal, setSchedulePickerOpenSignal] = useState(0);
  const [manualWhatsAppUrl, setManualWhatsAppUrl] = useState<string | null>(
    null,
  );
  const [checkoutIssue, setCheckoutIssue] = useState<{
    tone: CheckoutIssueTone;
    message: string;
  } | null>(null);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCouponCode, setAppliedCouponCode] = useState<string | null>(
    null,
  );
  const [couponStatus, setCouponStatus] = useState<string | null>(null);
  const [couponStatusTone, setCouponStatusTone] =
    useState<CouponStatusTone | null>(null);
  const [step, setStep] = useState<2 | 3>(2);

  useEffect(() => {
    router.prefetch("/confirmation");
  }, [router]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handlePageShow = () => {
      setIsSubmitting(false);
    };

    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (orderTypeParam === "pickup" || orderTypeParam === "delivery") {
      window.localStorage.setItem(PREFERRED_ORDER_TYPE_KEY, orderType);
      return;
    }

    const storedOrderType = window.localStorage.getItem(
      PREFERRED_ORDER_TYPE_KEY,
    );
    if (storedOrderType !== "pickup" && storedOrderType !== "delivery") return;

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("type", storedOrderType);
    router.replace(`/checkout?${nextParams.toString()}`, { scroll: false });
  }, [orderType, orderTypeParam, router, searchParams]);

  const showActionFeedback = useCallback((message: string) => {
    setActionFeedback(message);
    window.setTimeout(() => {
      setActionFeedback((prev) => (prev === message ? null : prev));
    }, 1500);
  }, []);

  const handleInputChange = useCallback(
    (field: keyof typeof deliveryInfo, value: string) => {
      const nextValue =
        field === "phone" ? formatSaudiPhoneInput(value) : value;
      setDeliveryInfo({ ...deliveryInfo, [field]: nextValue });
      if (submitted || errors[field as keyof CheckoutErrors]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    },
    [deliveryInfo, setDeliveryInfo, submitted, errors],
  );

  const pickArea = useCallback(
    (areaName: string) => {
      handleInputChange("area", areaName);
      trackCheckoutEvent("area_selected", { area: areaName });
      showActionFeedback("تم تحديث رسوم التوصيل");
    },
    [handleInputChange, showActionFeedback],
  );

  const handleScheduleChange = useCallback(
    (value: string | null) => {
      setDeliveryInfo({ ...deliveryInfo, scheduledTime: value });
      if (submitted || errors.scheduledTime) {
        setErrors((prev) => ({ ...prev, scheduledTime: undefined }));
      }
    },
    [deliveryInfo, errors.scheduledTime, setDeliveryInfo, submitted],
  );

  const focusSchedulePicker = useCallback(() => {
    setSchedulePickerOpenSignal((previous) => previous + 1);
    setIsSchedulePickerHighlighted(true);
    scrollToSection(schedulePickerRef.current ?? scheduleSectionRef.current);
    window.setTimeout(() => {
      setIsSchedulePickerHighlighted(false);
    }, 1200);
  }, []);

  const focusFirstInvalidSection = useCallback(
    (nextErrors: CheckoutErrors) => {
      if (nextErrors.name || nextErrors.phone) {
        scrollToSection(detailsSectionRef.current);
        return;
      }

      if (nextErrors.area) {
        scrollToSection(areaSectionRef.current);
        return;
      }

      if (nextErrors.scheduledTime) {
        focusSchedulePicker();
      }
    },
    [focusSchedulePicker],
  );

  const selectedArea = deliveryAreas.find((a) => a.name === deliveryInfo.area);
  const deliveryFee = isPickup ? 0 : selectedArea?.price || 0;
  const canRevealFulfillmentDetails = true;
  const isFinalTotalReady = isPickup || Boolean(selectedArea);
  const discountResult = useMemo(
    () =>
      resolveDiscount({
        config: discountConfig,
        subtotal: totalPrice,
        deliveryFee,
        couponCode: appliedCouponCode,
      }),
    [discountConfig, totalPrice, deliveryFee, appliedCouponCode],
  );
  const grandTotal = discountResult.finalTotal;
  const activeCouponCode = discountResult.codeApplied ?? null;

  const applyCoupon = useCallback(() => {
    const normalized = couponInput.trim().toUpperCase();
    if (!normalized) {
      setAppliedCouponCode(null);
      setCouponStatus("اكتب كود الخصم أولا");
      setCouponStatusTone("info");
      return;
    }
    if (!discountConfig.enabled) {
      setAppliedCouponCode(null);
      setCouponStatus("الخصومات غير مفعلة حاليا");
      setCouponStatusTone("error");
      return;
    }
    const matched = discountConfig.codes.find(
      (code) => code.code === normalized && code.active,
    );
    if (!matched) {
      setAppliedCouponCode(null);
      setCouponStatus("كود الخصم غير صحيح أو غير فعال");
      setCouponStatusTone("error");
      return;
    }
    const currentTotal = totalPrice + deliveryFee;
    if (matched.minOrder && currentTotal < matched.minOrder) {
      setAppliedCouponCode(null);
      setCouponStatus(`هذا الكود يتطلب حد أدنى ${matched.minOrder}`);
      setCouponStatusTone("error");
      return;
    }
    setAppliedCouponCode(normalized);
    setCouponStatus("تم تطبيق الكود");
    setCouponStatusTone("success");
    trackCheckoutEvent("coupon_applied", { code: normalized });
    showActionFeedback("تم تطبيق كود الخصم");
  }, [
    couponInput,
    discountConfig,
    totalPrice,
    deliveryFee,
    showActionFeedback,
  ]);

  const clearCoupon = useCallback(() => {
    setAppliedCouponCode(null);
    setCouponInput("");
    setCouponStatus(null);
    setCouponStatusTone(null);
  }, []);

  const maxMakingTime = items.reduce(
    (max, item) =>
      Math.max(max, normalizeMakingTimeMinutes(item.makingTime || 0)),
    0,
  );
  const minimumLeadTimeMinutes = maxMakingTime + DELIVERY_BUFFER_MINUTES;
  const closedDates = orderScheduleConfig.closedDates;
  const scheduleWindows = orderScheduleConfig.windows;
  const availableScheduleDays = useMemo(
    () => generateDeliveryDaySlots(minimumLeadTimeMinutes, closedDates, scheduleWindows),
    [closedDates, minimumLeadTimeMinutes, scheduleWindows],
  );
  const availableScheduleLabels = useMemo(
    () =>
      new Set(
        availableScheduleDays.flatMap((day) =>
          day.slots.map((slot) => `${day.dayLabel} ${day.dateLabel} - ${slot}`),
        ),
      ),
    [availableScheduleDays],
  );
  const isTodayClosed = useMemo(
    () => isSaudiDateClosed(new Date(), closedDates),
    [closedDates],
  );
  const hasAvailableScheduleDays = availableScheduleDays.length > 0;
  const [displayGrandTotal, setDisplayGrandTotal] = useState(grandTotal);
  const [, setIsTotalAnimating] = useState(false);
  const checkoutSnapshot = useMemo(
    () =>
      JSON.stringify({
        orderType,
        area: selectedArea?.name ?? deliveryInfo.area,
        name: deliveryInfo.name,
        phone: deliveryInfo.phone,
        locationUrl: deliveryInfo.locationUrl,
        scheduledTime: deliveryInfo.scheduledTime,
        couponCode: activeCouponCode,
        items: items.map((item) => ({
          cartKey: item.cartKey,
          quantity: item.quantity,
        })),
      }),
    [
      activeCouponCode,
      deliveryInfo.area,
      deliveryInfo.locationUrl,
      deliveryInfo.name,
      deliveryInfo.phone,
      deliveryInfo.scheduledTime,
      items,
      orderType,
      selectedArea?.name,
    ],
  );

  useEffect(() => {
    if (animatedTotalRef.current === null) {
      animatedTotalRef.current = grandTotal;
      setDisplayGrandTotal(grandTotal);
      return;
    }

    const previousValue = animatedTotalRef.current;
    if (previousValue === grandTotal) {
      setDisplayGrandTotal(grandTotal);
      return;
    }

    const durationMs = 360;
    const startTime = performance.now();
    setIsTotalAnimating(true);

    const step = (timestamp: number) => {
      const progress = Math.min((timestamp - startTime) / durationMs, 1);
      const nextValue = Math.round(
        previousValue + (grandTotal - previousValue) * progress,
      );
      animatedTotalRef.current = nextValue;
      setDisplayGrandTotal(nextValue);

      if (progress < 1) {
        window.requestAnimationFrame(step);
        return;
      }

      animatedTotalRef.current = grandTotal;
      setDisplayGrandTotal(grandTotal);
      window.setTimeout(() => setIsTotalAnimating(false), 180);
    };

    const frame = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(frame);
  }, [grandTotal]);

  useEffect(() => {
    if (!appliedCouponCode || activeCouponCode === appliedCouponCode) return;

    setAppliedCouponCode(null);
    setCouponStatus(
      discountConfig.enabled
        ? "تم إلغاء الكود لأن الطلب لم يعد يطابق شروط الخصم"
        : "تم تعطيل الخصومات حاليًا",
    );
    setCouponStatusTone("error");
  }, [activeCouponCode, appliedCouponCode, discountConfig.enabled]);

  useEffect(() => {
    if (isPickup || !deliveryInfo.area || selectedArea) return;
    const normalizedInput = normalizeText(deliveryInfo.area);
    const exactMatch = deliveryAreas.find(
      (a) => normalizeText(a.name) === normalizedInput,
    );
    if (exactMatch) {
      setDeliveryInfo({ ...deliveryInfo, area: exactMatch.name });
      setAreaFocused(false);
      setErrors((prev) => ({ ...prev, area: undefined }));
    }
  }, [deliveryInfo, isPickup, selectedArea, setDeliveryInfo, deliveryAreas]);

  useEffect(() => {
    if (
      !canRevealFulfillmentDetails ||
      previousRevealStateRef.current === canRevealFulfillmentDetails
    ) {
      previousRevealStateRef.current = canRevealFulfillmentDetails;
      return;
    }

    previousRevealStateRef.current = canRevealFulfillmentDetails;
    window.setTimeout(() => scrollToSection(detailsSectionRef.current), 150);
  }, [canRevealFulfillmentDetails]);

  const infoDone = useMemo(() => {
    return Boolean(deliveryInfo.name.trim() && deliveryInfo.phone.trim());
  }, [deliveryInfo.name, deliveryInfo.phone]);

  useEffect(() => {
    if (infoDone && !previousInfoDoneRef.current) {
      window.setTimeout(() => scrollToSection(scheduleSectionRef.current), 160);
    }

    previousInfoDoneRef.current = infoDone;
  }, [infoDone]);

  useEffect(() => {
    if (!deliveryInfo.scheduledTime) return;
    if (availableScheduleLabels.has(deliveryInfo.scheduledTime)) return;

    setDeliveryInfo({
      ...deliveryInfo,
      scheduledTime: null,
    });
  }, [availableScheduleLabels, deliveryInfo, setDeliveryInfo]);

  useEffect(() => {
    if (previousCheckoutSnapshotRef.current === null) {
      previousCheckoutSnapshotRef.current = checkoutSnapshot;
      return;
    }

    if (
      previousCheckoutSnapshotRef.current !== checkoutSnapshot &&
      manualWhatsAppUrl &&
      !isSubmitting
    ) {
      setManualWhatsAppUrl(null);
    }

    previousCheckoutSnapshotRef.current = checkoutSnapshot;
  }, [checkoutSnapshot, isSubmitting, manualWhatsAppUrl]);

  const validate = useCallback((): CheckoutErrors => {
    const next: CheckoutErrors = {};
    if (!deliveryInfo.name.trim()) next.name = "الاسم مطلوب";

    if (!deliveryInfo.phone.trim()) next.phone = "رقم الهاتف مطلوب";

    if (!isPickup && !selectedArea) next.area = "اختر منطقة التوصيل من القائمة";
    if (!hasAvailableScheduleDays)
      next.scheduledTime = "لا توجد مواعيد متاحة حاليا";
    else if (!deliveryInfo.scheduledTime)
      next.scheduledTime = isTodayClosed
        ? "اليوم مغلق، اختر موعدًا في يوم آخر"
        : "اختر موعدًا قبل إتمام الطلب";
    return next;
  }, [
    deliveryInfo.name,
    deliveryInfo.phone,
    deliveryInfo.scheduledTime,
    hasAvailableScheduleDays,
    isPickup,
    isTodayClosed,
    selectedArea,
  ]);

  const deliveryAccuracyText = useMemo(() => {
    if (isPickup) return "جاهزية الطلب حسب موعد الاستلام المختار.";
    if (isTodayClosed && !deliveryInfo.scheduledTime)
      return "اليوم مغلق بالكامل، لذا يلزم تحديد موعد من يوم آخر.";
    if (deliveryInfo.scheduledTime)
      return `التسليم المتوقع ضمن 15-25 دقيقة من الموعد: ${deliveryInfo.scheduledTime}`;
    return "سنؤكد وقت التسليم المناسب بعد مراجعة وقت التحضير.";
  }, [isPickup, isTodayClosed, deliveryInfo.scheduledTime]);
  const missingCheckoutSteps = useMemo(() => {
    const steps: string[] = [];

    if (!deliveryInfo.name.trim()) steps.push("الاسم");
    if (!deliveryInfo.phone.trim()) steps.push("رقم الجوال");
    if (!isPickup && !selectedArea) steps.push("المنطقة");
    if (!deliveryInfo.scheduledTime) steps.push("الموعد");

    return steps;
  }, [
    deliveryInfo.name,
    deliveryInfo.phone,
    deliveryInfo.scheduledTime,
    isPickup,
    selectedArea,
  ]);
  const checkoutButtonLabel = isSubmitting
    ? "جاري الإرسال..."
    : "إتمام الطلب عبر واتساب";

  const goToReview = useCallback(() => {
    setSubmitted(true);
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      showActionFeedback("يرجى تصحيح الحقول المحددة");
      window.setTimeout(() => focusFirstInvalidSection(nextErrors), 120);
      return;
    }

    trackCheckoutEvent("checkout_step_advanced", { orderType });
    setStep(3);
    window.setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50);
  }, [focusFirstInvalidSection, orderType, showActionFeedback, validate]);

  const goToDetails = useCallback(() => {
    setStep(2);
    window.setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50);
  }, []);

  const handleWhatsAppCheckout = async () => {
    setSubmitted(true);
    setCheckoutIssue(null);
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      showActionFeedback("يرجى تصحيح الحقول المحددة");
      window.setTimeout(() => focusFirstInvalidSection(nextErrors), 120);
      return;
    }

    const cartItems = items.map((item) => ({
      id: item.id,
      name: item.name,
      nameEn: (item as { nameEn?: string }).nameEn || "",
      quantity: item.quantity,
      price: item.price,
      selectedIngredients: item.selectedIngredients,
      makingTime: item.makingTime || 0,
    }));

    const whatsAppDiscount = {
      total: grandTotal,
      amount: discountResult.totalDiscount,
      code: activeCouponCode,
    };
    const message = isPickup
      ? generatePickupWhatsAppMessage(cartItems, totalPrice, deliveryInfo, whatsAppDiscount)
      : generateWhatsAppMessage(
          cartItems,
          totalPrice,
          deliveryInfo,
          deliveryFee,
          whatsAppDiscount,
        );

    const orderPayload = {
      customerName: deliveryInfo.name,
      customerPhone: deliveryInfo.phone,
      customerArea: isPickup ? "" : selectedArea?.name || "",
      orderType: isPickup ? "pickup" : "delivery",
      items: cartItems.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        selectedIngredients: item.selectedIngredients,
      })),
      notes: "",
      scheduledTime: deliveryInfo.scheduledTime,
      couponCode: activeCouponCode,
    };
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;

    if (isLikelyIOSDevice()) {
      setIsSubmitting(true);
      setManualWhatsAppUrl(whatsappUrl);
      trackCheckoutEvent("checkout_started", {
        orderType,
        itemsCount: items.length,
        areaSelected: Boolean(selectedArea),
        handoffMode: "ios_await",
      });

      const iosController = new AbortController();
      const iosTimeoutId = window.setTimeout(() => iosController.abort(), 15000);

      try {
        const orderResponse = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(orderPayload),
          signal: iosController.signal,
        });

        if (!orderResponse.ok) throw new Error("save failed");
        const orderData: {
          total?: number;
          totalDiscount?: number;
          codeApplied?: string | null;
        } = await orderResponse.json();
        window.clearTimeout(iosTimeoutId);

        const confirmedTotal =
          typeof orderData.total === "number" ? orderData.total : grandTotal;
        const confirmedDiscount =
          typeof orderData.totalDiscount === "number"
            ? orderData.totalDiscount
            : discountResult.totalDiscount;

        clearCart();
        if (typeof window !== "undefined") {
          window.localStorage.setItem(PREFERRED_ORDER_TYPE_KEY, orderType);
        }
        trackCheckoutEvent("checkout_saved", {
          orderType,
          total: confirmedTotal,
          discount: confirmedDiscount,
        });
        // Go straight to WhatsApp instead of routing through /confirmation first: Safari
        // only reliably treats window.location.href as a same-app navigation - opening
        // another app's URL scheme (wa.me -> WhatsApp) without a direct, in-page tap is
        // liable to be silently blocked once a route change has happened in between and
        // the click's user-activation is gone. This mirrors the failure branch below,
        // which already used this exact approach because it's the one proven to work.
        window.location.href = whatsappUrl;
      } catch (error) {
        window.clearTimeout(iosTimeoutId);
        // Order save failed or timed out — still send the customer to WhatsApp,
        // since that's the channel the business actually fulfills orders from.
        trackCheckoutEvent("checkout_failed", {
          reason: error instanceof Error ? error.name : "unknown",
          handoffMode: "ios_await",
        });
        window.location.href = whatsappUrl;
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    setIsSubmitting(true);
    trackCheckoutEvent("checkout_started", {
      orderType,
      itemsCount: items.length,
      areaSelected: Boolean(selectedArea),
    });

    const whatsappWindow = window.open("", "_blank");
    if (whatsappWindow) {
      renderWhatsAppHandoffWindow(whatsappWindow, "saving");
      trackCheckoutEvent("whatsapp_popup_opened", { blocked: false });
    } else {
      trackCheckoutEvent("whatsapp_popup_opened", { blocked: true });
      setCheckoutIssue({
        tone: "warning",
        message:
          "تعذر فتح نافذة واتساب تلقائيًا. استخدم الزر اليدوي بالأسفل إذا لم يتم الانتقال.",
      });
      showActionFeedback(
        "إذا لم يفتح واتساب تلقائيًا فاستخدم الزر اليدوي بالأسفل.",
      );
    }

    // Keep the manual fallback available even if saving the order is slow or fails.
    setManualWhatsAppUrl(whatsappUrl);

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 15000);

    try {
      const orderResponse = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
        signal: controller.signal,
      });

      if (!orderResponse.ok) throw new Error("save failed");
      const orderData: {
        total?: number;
        totalDiscount?: number;
        codeApplied?: string | null;
      } = await orderResponse.json();
      window.clearTimeout(timeoutId);
      const confirmedTotal =
        typeof orderData.total === "number" ? orderData.total : grandTotal;
      const confirmedDiscount =
        typeof orderData.totalDiscount === "number"
          ? orderData.totalDiscount
          : discountResult.totalDiscount;

      clearCart();
      if (typeof window !== "undefined") {
        window.localStorage.setItem(PREFERRED_ORDER_TYPE_KEY, orderType);
      }

      if (whatsappWindow && !whatsappWindow.closed) {
        renderWhatsAppHandoffWindow(whatsappWindow, "opening", whatsappUrl);
        // Wait out the same 250ms so the "opening" state is visible before redirecting, but
        // await it (rather than fire-and-forget) so we can re-check whether the popup is
        // still open *after* the redirect attempt - if the customer closed it during this
        // window, waOpened must reflect that so the confirmation page still offers a retry.
        await new Promise((resolve) => window.setTimeout(resolve, 250));
        try {
          whatsappWindow.opener = null;
          whatsappWindow.location.replace(whatsappUrl);
        } catch {
          // Async continuation (past the awaited delay) - a browser popup blocker may
          // silently drop this without a user gesture; the closed-check below covers it.
          window.open(whatsappUrl, "_blank");
        }
      }
      const whatsappActuallyOpened = Boolean(whatsappWindow && !whatsappWindow.closed);
      const params = new URLSearchParams({
        name: deliveryInfo.name,
        area: isPickup ? "" : selectedArea?.name || "",
        total: String(confirmedTotal),
        discount: String(confirmedDiscount),
        code: orderData.codeApplied ?? activeCouponCode ?? "",
        type: isPickup ? "pickup" : "delivery",
        time: deliveryInfo.scheduledTime ?? "",
        wa: whatsappUrl,
        waOpened: whatsappActuallyOpened ? "1" : "0",
      });
      const confirmationUrl = `/confirmation?${params.toString()}`;
      trackCheckoutEvent("checkout_saved", {
        orderType,
        total: confirmedTotal,
        discount: confirmedDiscount,
      });
      router.push(confirmationUrl);
    } catch (error) {
      window.clearTimeout(timeoutId);
      if (whatsappWindow && !whatsappWindow.closed) {
        renderWhatsAppHandoffWindow(whatsappWindow, "error");
      }
      try {
        if (!whatsappWindow || whatsappWindow.closed) {
          window.open(whatsappUrl, "_blank");
        }
      } catch {
        window.open(whatsappUrl, "_blank");
      }
      trackCheckoutEvent("checkout_failed", {
        reason: error instanceof Error ? error.name : "unknown",
      });
      setCheckoutIssue({
        tone: "error",
        message:
          error instanceof Error && error.name === "AbortError"
            ? "استغرق حفظ الطلب وقتًا أطول من المتوقع، لكن تم تجهيز واتساب لإكمال الطلب يدويًا."
            : "تعذر حفظ الطلب تلقائيًا، لكن ما زال بإمكانك المتابعة عبر واتساب اليدوي.",
      });
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <main
        className={cn(
          theme.main,
          "flex flex-col items-center justify-center p-6 text-center",
        )}
      >
        <div className="w-24 h-24 rounded-full bg-amal-grey flex items-center justify-center mb-6">
          <Trash2 className="h-10 w-10 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">السلة فارغة</h1>
        <p className="text-muted-foreground mb-6">
          لم تقم بإضافة أي منتجات بعد
        </p>
        <Link href="/">
          <Button className="rounded-full px-8">تصفح المنتجات</Button>
        </Link>
      </main>
    );
  }

  {
    const selectFulfillment = (method: OrderMode) => {
      const nextParams = new URLSearchParams(searchParams.toString());
      nextParams.set("type", method);
      router.replace(`/checkout?${nextParams.toString()}`, { scroll: false });
    };

    return (
      <DeliveryFlowEditorial
        isPickup={isPickup}
        onSelectFulfillment={selectFulfillment}
        deliveryInfo={deliveryInfo}
        onNameChange={(v) => handleInputChange("name", v)}
        onPhoneChange={(v) => handleInputChange("phone", v)}
        nameError={errors.name}
        phoneError={errors.phone}
        deliveryAreas={deliveryAreas}
        selectedArea={selectedArea}
        onPickArea={pickArea}
        areaError={errors.area}
        scheduledTime={deliveryInfo.scheduledTime}
        onScheduleChange={handleScheduleChange}
        minimumLeadTimeMinutes={minimumLeadTimeMinutes}
        closedDates={closedDates}
        windows={scheduleWindows}
        schedulePickerOpenSignal={schedulePickerOpenSignal}
        onOpenSchedulePicker={focusSchedulePicker}
        deliveryAccuracyText={deliveryAccuracyText}
        scheduleError={errors.scheduledTime}
        step={step}
        onGoToReview={goToReview}
        onGoToDetails={goToDetails}
        missingCheckoutSteps={missingCheckoutSteps}
        actionFeedback={actionFeedback}
        items={items}
        totalPrice={totalPrice}
        deliveryFee={deliveryFee}
        totalDiscount={discountResult.totalDiscount}
        grandTotal={displayGrandTotal}
        isFinalTotalReady={isFinalTotalReady}
        couponInput={couponInput}
        onCouponInputChange={setCouponInput}
        onApplyCoupon={applyCoupon}
        onClearCoupon={clearCoupon}
        appliedCouponCode={activeCouponCode}
        couponStatus={couponStatus}
        couponStatusTone={couponStatusTone}
        onConfirmOrder={handleWhatsAppCheckout}
        isSubmitting={isSubmitting}
        checkoutButtonLabel={checkoutButtonLabel}
        manualWhatsAppUrl={manualWhatsAppUrl}
        checkoutIssue={checkoutIssue}
        onDismissCheckoutIssue={() => setCheckoutIssue(null)}
      />
    );
  }

}

export default function CheckoutPage() {
  return (
    <Suspense>
      <CheckoutContent />
    </Suspense>
  );
}
