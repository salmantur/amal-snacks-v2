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
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ArrowRight,
  Clock3,
  Store,
  Minus,
  Plus,
  Trash2,
  Truck,
  MapPin,
  User,
  Phone,
  ShoppingBag,
  CheckCircle2,
  ShieldCheck,
  MessageCircle,
} from "lucide-react";
import { useCart } from "@/components/cart-provider";
import type { CartItem } from "@/components/cart-provider";
import { TimePicker } from "@/components/time-picker";
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
  formatArabicDuration,
  generateDeliveryDaySlots,
  isSaudiDateClosed,
} from "@/lib/checkout-schedule";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PriceWithRiyalLogo } from "@/components/ui/price-with-riyal-logo";

type CheckoutErrors = {
  name?: string;
  phone?: string;
  area?: string;
  scheduledTime?: string;
};
type OrderMode = "pickup" | "delivery";
type CouponStatusTone = "success" | "error" | "info";

const EMPTY_DELIVERY_INFO = {
  name: "",
  phone: "",
  address: "",
  locationUrl: "",
  area: "",
  notes: "",
  scheduledTime: null,
};

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

function SectionStatusBadge({ done, label }: { done: boolean; label: string }) {
  return (
    <span
      className={cn(
        "rounded-full px-3 py-1 text-xs font-semibold",
        done
          ? "bg-emerald-100 text-emerald-700"
          : "bg-amber-100 text-amber-700",
      )}
    >
      {label}
    </span>
  );
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

function CheckoutItemImage({ item }: { item: CartItem }) {
  const [imgError, setImgError] = useState(false);
  if (!item.image || imgError) {
    return (
      <div className="w-16 h-16 rounded-xl flex-shrink-0 bg-muted flex items-center justify-center">
        <ShoppingBag className="h-6 w-6 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-muted">
      <Image
        src={item.image}
        alt={item.name}
        fill
        sizes="64px"
        className="object-cover"
        onError={() => setImgError(true)}
      />
    </div>
  );
}

function ProgressStep({ label, done }: { label: string; done: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          "w-6 h-6 rounded-full flex items-center justify-center border text-[10px] font-bold",
          done
            ? "bg-primary text-primary-foreground border-primary"
            : "bg-background text-muted-foreground border-border",
        )}
      >
        {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : "•"}
      </div>
      <span
        className={cn(
          "text-xs font-medium",
          done ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {label}
      </span>
    </div>
  );
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/\s+/g, " ")
    .trim();
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getEarliestDeliverySlot(minMinutes: number): string | null {
  const now = new Date();
  const saudiNow = new Date(
    now.getTime() + (3 * 60 - now.getTimezoneOffset()) * 60000,
  );
  const earliest = new Date(saudiNow.getTime() + (minMinutes + 45) * 60 * 1000);
  const OPEN_HOUR = 15;
  const CLOSE_HOUR = 22;
  const dayNames = [
    "الأحد",
    "الاثنين",
    "الثلاثاء",
    "الأربعاء",
    "الخميس",
    "الجمعة",
    "السبت",
  ];
  const monthNames = [
    "يناير",
    "فبراير",
    "مارس",
    "أبريل",
    "مايو",
    "يونيو",
    "يوليو",
    "أغسطس",
    "سبتمبر",
    "أكتوبر",
    "نوفمبر",
    "ديسمبر",
  ];

  for (let i = 0; i < 7; i++) {
    const day = new Date(saudiNow);
    day.setDate(saudiNow.getDate() + i);
    for (let hour = OPEN_HOUR; hour < CLOSE_HOUR; hour++) {
      for (const min of [0, 30]) {
        const slot = new Date(day);
        slot.setHours(hour, min, 0, 0);
        if (slot <= earliest) continue;

        const dayLabel =
          i === 0 ? "اليوم" : i === 1 ? "غدًا" : dayNames[day.getDay()];
        const h12 = hour > 12 ? hour - 12 : hour;
        const period = hour >= 12 ? "م" : "ص";
        return `${dayLabel} ${day.getDate()} ${monthNames[day.getMonth()]} - ${h12}:${min === 0 ? "00" : "30"} ${period}`;
      }
    }
  }

  return null;
}

function normalizeMakingTimeMinutes(value: number): number {
  if (!value || value <= 0) return 0;
  // Backward compatibility: some old records stored "24" meaning 24 hours.
  if (value === 24) return 24 * 60;
  return value;
}

function CheckoutContent() {
  const searchParams = useSearchParams();
  const orderTypeParam = searchParams.get("type");
  const orderType = (orderTypeParam as OrderMode) || "delivery";
  const isPickup = orderType === "pickup";
  const theme = {
    main: "min-h-screen bg-[radial-gradient(circle_at_top,_#f7fafc,_#edf2f7_50%,_#e2e8f0)] pb-10",
    header:
      "sticky top-0 z-50 border-b border-white/70 bg-white/60 backdrop-blur-xl",
    section:
      "rounded-3xl border border-white/60 bg-white/55 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.07)] backdrop-blur-md",
    summary:
      "rounded-3xl border border-white/60 bg-white/55 p-4 backdrop-blur-md",
    input: "bg-white/70",
    ctaWrap: "mx-auto w-full max-w-6xl px-4 pb-8 pt-2",
  };

  const router = useRouter();
  const {
    items,
    totalPrice,
    updateQuantity,
    removeItem,
    deliveryInfo,
    setDeliveryInfo,
    clearCart,
  } = useCart();
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
  const [areaFocused, setAreaFocused] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [highlightedCartKey, setHighlightedCartKey] = useState<string | null>(
    null,
  );
  const [isSchedulePickerHighlighted, setIsSchedulePickerHighlighted] =
    useState(false);
  const [schedulePickerOpenSignal, setSchedulePickerOpenSignal] = useState(0);
  const [isCartExpanded, setIsCartExpanded] = useState(true);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [manualWhatsAppUrl, setManualWhatsAppUrl] = useState<string | null>(
    null,
  );
  const [couponInput, setCouponInput] = useState("");
  const [appliedCouponCode, setAppliedCouponCode] = useState<string | null>(
    null,
  );
  const [couponStatus, setCouponStatus] = useState<string | null>(null);
  const [couponStatusTone, setCouponStatusTone] =
    useState<CouponStatusTone | null>(null);

  useEffect(() => {
    router.prefetch("/confirmation");
  }, [router]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsCartExpanded(window.innerWidth >= 768);
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

  const handleResetRememberedDetails = useCallback(() => {
    setDeliveryInfo({
      ...EMPTY_DELIVERY_INFO,
      scheduledTime: deliveryInfo.scheduledTime,
    });
    setErrors({});
    setSubmitted(false);
    setManualWhatsAppUrl(null);
    trackCheckoutEvent("details_reset", { orderType });
    showActionFeedback("تم مسح البيانات المحفوظة");
    window.setTimeout(() => scrollToSection(detailsSectionRef.current), 120);
  }, [
    deliveryInfo.scheduledTime,
    orderType,
    setDeliveryInfo,
    showActionFeedback,
  ]);

  const handleUseCurrentLocation = useCallback(() => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      showActionFeedback("المتصفح لا يدعم تحديد الموقع");
      return;
    }

    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const nextLocationUrl = `https://maps.google.com/?q=${latitude},${longitude}`;
        setDeliveryInfo({
          ...deliveryInfo,
          locationUrl: nextLocationUrl,
        });
        setIsDetectingLocation(false);
        trackCheckoutEvent("location_detected", { orderType });
        showActionFeedback("تم إضافة موقعك الحالي");
      },
      () => {
        setIsDetectingLocation(false);
        showActionFeedback("تعذر الوصول إلى موقعك الحالي");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  }, [deliveryInfo, orderType, setDeliveryInfo, showActionFeedback]);

  const pickArea = useCallback(
    (areaName: string) => {
      handleInputChange("area", areaName);
      trackCheckoutEvent("area_selected", { area: areaName });
      showActionFeedback("تم تحديث رسوم التوصيل");
    },
    [handleInputChange, showActionFeedback],
  );

  const handleDecrease = useCallback(
    (item: CartItem) => {
      const nextQty = item.quantity - 1;
      updateQuantity(item.cartKey, nextQty);
      setHighlightedCartKey(item.cartKey);
      window.setTimeout(
        () =>
          setHighlightedCartKey((prev) =>
            prev === item.cartKey ? null : prev,
          ),
        500,
      );
      showActionFeedback(
        nextQty <= 0 ? "تم حذف الصنف من السلة" : "تم تحديث الكمية",
      );
    },
    [updateQuantity, showActionFeedback],
  );

  const handleIncrease = useCallback(
    (item: CartItem) => {
      updateQuantity(item.cartKey, item.quantity + 1);
      setHighlightedCartKey(item.cartKey);
      window.setTimeout(
        () =>
          setHighlightedCartKey((prev) =>
            prev === item.cartKey ? null : prev,
          ),
        500,
      );
      showActionFeedback("تم تحديث الكمية");
    },
    [updateQuantity, showActionFeedback],
  );

  const handleRemove = useCallback(
    (item: CartItem) => {
      removeItem(item.cartKey);
      showActionFeedback("تم حذف الصنف من السلة");
    },
    [removeItem, showActionFeedback],
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

  const selectedArea = deliveryAreas.find((a) => a.name === deliveryInfo.area);
  const deliveryFee = isPickup ? 0 : selectedArea?.price || 0;
  const hasStoredDetails = Boolean(
    deliveryInfo.name ||
    deliveryInfo.phone ||
    deliveryInfo.area ||
    deliveryInfo.locationUrl,
  );
  const isScheduled = Boolean(deliveryInfo.scheduledTime);
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
  const maxMakingTime = items.reduce(
    (max, item) =>
      Math.max(max, normalizeMakingTimeMinutes(item.makingTime || 0)),
    0,
  );
  const minimumLeadTimeMinutes = maxMakingTime + DELIVERY_BUFFER_MINUTES;
  const closedDates = orderScheduleConfig.closedDates;
  const availableScheduleDays = useMemo(
    () => generateDeliveryDaySlots(minimumLeadTimeMinutes, closedDates),
    [closedDates, minimumLeadTimeMinutes],
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
  const [isTotalAnimating, setIsTotalAnimating] = useState(false);
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

  const filteredAreas = useMemo(() => {
    if (isPickup) return [];
    const q = normalizeText(deliveryInfo.area || "");
    if (!q) return deliveryAreas;
    return deliveryAreas.filter((a) => normalizeText(a.name).includes(q));
  }, [deliveryInfo.area, isPickup, deliveryAreas]);

  const quickAreas = useMemo(() => deliveryAreas.slice(0, 6), [deliveryAreas]);
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
    else {
      const digitsOnly = normalizeSaudiPhoneDigits(deliveryInfo.phone);
      if (digitsOnly.length !== 10 || !digitsOnly.startsWith("05"))
        next.phone = "أدخل رقم جوال سعودي صحيح";
    }

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
  const scheduleDone = Boolean(deliveryInfo.scheduledTime);
  const scheduleBadgeLabel = deliveryInfo.scheduledTime ? "تم التحديد" : "مطلوب";

  const fieldBaseClass = `w-full min-h-12 rounded-2xl border border-white/65 ${theme.input} px-4 py-4 pr-12 text-base text-foreground placeholder:text-muted-foreground transition-all focus:outline-none focus:ring-2 focus:ring-primary/20`;
  const mutedTextClass = "text-muted-foreground";
  const summaryMutedTextClass = "text-muted-foreground";
  const headerActionClass =
    "flex h-11 w-11 items-center justify-center rounded-full bg-white/80 shadow-sm transition-transform active:scale-95";
  const layoutWidthClass = "max-w-6xl";
  const contentGridClass = "grid gap-4 items-start";
  const contentColumnClass = "space-y-4";
  const asideColumnClass = "hidden";
  const couponToneClass =
    appliedCouponCode || discountResult.codeDiscountAmount > 0
      ? "border-green-200 bg-green-50 text-green-700"
      : couponStatusTone === "error"
        ? "border-red-200 bg-red-50 text-red-700"
        : couponStatusTone === "info"
          ? "border-amber-200 bg-amber-50 text-amber-700"
          : "border-border/60 bg-background/70 text-muted-foreground";
  const combinedOrderNotes = useMemo(() => {
    if (isPickup) return "";
    return deliveryInfo.locationUrl.trim()
      ? `رابط الموقع: ${deliveryInfo.locationUrl.trim()}`
      : "";
  }, [deliveryInfo.locationUrl, isPickup]);
  const checkoutDisabled = isSubmitting || (!isPickup && !selectedArea);
  const checkoutButtonLabel = isSubmitting
    ? "جاري الإرسال..."
    : !isPickup && !selectedArea
      ? "اختر المنطقة أولًا"
      : "إتمام الطلب عبر واتساب";

  const headerSummaryText = isPickup
    ? "استلام من المحل"
    : selectedArea
      ? `التوصيل إلى ${selectedArea.name}`
      : "اختر منطقة التوصيل";

  const handleWhatsAppCheckout = async () => {
    setSubmitted(true);
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      showActionFeedback("يرجى تصحيح الحقول المحددة");
      return;
    }

    setIsSubmitting(true);
    trackCheckoutEvent("checkout_started", {
      orderType,
      itemsCount: items.length,
      areaSelected: Boolean(selectedArea),
    });
    const cartItems = items.map((item) => ({
      id: item.id,
      name: item.name,
      nameEn: (item as { nameEn?: string }).nameEn || "",
      quantity: item.quantity,
      price: item.price,
      selectedIngredients: item.selectedIngredients,
      makingTime: item.makingTime || 0,
    }));

    const message = isPickup
      ? generatePickupWhatsAppMessage(cartItems, totalPrice, deliveryInfo)
      : generateWhatsAppMessage(
          cartItems,
          totalPrice,
          deliveryInfo,
          deliveryFee,
        );

    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
    const whatsappWindow = window.open("", "_blank");
    if (whatsappWindow) {
      renderWhatsAppHandoffWindow(whatsappWindow, "saving");
      trackCheckoutEvent("whatsapp_popup_opened", { blocked: false });
    } else {
      trackCheckoutEvent("whatsapp_popup_opened", { blocked: true });
      showActionFeedback(
        "سنجهز زر واتساب اليدوي بعد حفظ الطلب إذا لم يفتح تلقائيًا.",
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
        body: JSON.stringify({
          customerName: deliveryInfo.name,
          customerPhone: deliveryInfo.phone,
          customerArea: isPickup ? "" : selectedArea?.name || "",
          orderType: isPickup ? "pickup" : "delivery",
          items: cartItems.map((item) => ({
            id: item.id,
            quantity: item.quantity,
            selectedIngredients: item.selectedIngredients,
          })),
          notes: combinedOrderNotes,
          scheduledTime: deliveryInfo.scheduledTime,
          couponCode: activeCouponCode,
        }),
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
      const params = new URLSearchParams({
        name: deliveryInfo.name,
        area: isPickup ? "" : selectedArea?.name || "",
        total: String(confirmedTotal),
        discount: String(confirmedDiscount),
        code: orderData.codeApplied ?? activeCouponCode ?? "",
        type: isPickup ? "pickup" : "delivery",
        time: deliveryInfo.scheduledTime ?? "",
        wa: whatsappUrl,
      });
      const confirmationUrl = `/confirmation?${params.toString()}`;
      if (whatsappWindow && !whatsappWindow.closed) {
        renderWhatsAppHandoffWindow(whatsappWindow, "opening", whatsappUrl);
      }
      trackCheckoutEvent("checkout_saved", {
        orderType,
        total: confirmedTotal,
        discount: confirmedDiscount,
      });
      router.push(confirmationUrl);

      window.setTimeout(() => {
        try {
          if (whatsappWindow && !whatsappWindow.closed) {
            whatsappWindow.location.href = whatsappUrl;
          } else {
            window.open(whatsappUrl, "_blank");
          }
        } catch {
          window.open(whatsappUrl, "_blank");
        }
      }, 700);
    } catch (error) {
      window.clearTimeout(timeoutId);
      if (whatsappWindow && !whatsappWindow.closed) {
        renderWhatsAppHandoffWindow(whatsappWindow, "error");
      }
      try {
        if (whatsappWindow && !whatsappWindow.closed) {
          whatsappWindow.location.href = whatsappUrl;
        } else {
          window.open(whatsappUrl, "_blank");
        }
      } catch {
        window.open(whatsappUrl, "_blank");
      }
      trackCheckoutEvent("checkout_failed", {
        reason: error instanceof Error ? error.name : "unknown",
      });
      alert(
        error instanceof Error && error.name === "AbortError"
          ? "استغرق حفظ الطلب وقتًا أطول من المتوقع، لكن تم تجهيز واتساب لإكمال الطلب."
          : "تعذر حفظ الطلب تلقائيًا، لكن تم تجهيز واتساب لإكمال الطلب.",
      );
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

  return (
    <main className={theme.main}>
      <header className={theme.header}>
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/" className={headerActionClass}>
            <ArrowRight className="h-5 w-5" />
          </Link>
          <div className="text-right">
            <h1 className="text-xl font-bold">إتمام الطلب</h1>
            <p className={cn("text-xs", mutedTextClass)}>
              {headerSummaryText} | {items.length} أصناف
            </p>
          </div>
        </div>

        <div className="hidden">
          <PriceWithRiyalLogo value={displayGrandTotal} />
        </div>
        <div className="hidden">
          <ProgressStep label="السلة" done={items.length > 0} />
        </div>
      </header>

      {actionFeedback ? (
        <div className="px-4 pt-3">
          <div className="rounded-2xl border border-primary/25 bg-primary/10 text-primary text-sm font-medium px-4 py-3 animate-in fade-in slide-in-from-top-1 duration-300">
            {actionFeedback}
          </div>
        </div>
      ) : null}

      {manualWhatsAppUrl ? (
        <div className="px-4 pt-3">
          <div className="rounded-2xl border border-[#25D366]/25 bg-[#25D366]/10 px-4 py-3 text-right">
            <p className="text-sm font-semibold text-[#1f8f48]">
              زر واتساب اليدوي جاهز إذا احتجته
            </p>
            <a
              href={manualWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex min-h-11 items-center justify-center rounded-full bg-[#25D366] px-4 text-sm font-bold text-white"
            >
              فتح واتساب يدويًا
            </a>
          </div>
        </div>
      ) : null}

      <div className={cn("mx-auto p-4 space-y-5 lg:space-y-6", layoutWidthClass)}>
        <div className={contentGridClass}>
          <div className={contentColumnClass}>
            <section className="hidden">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="text-right">
                  <h2 className="text-lg font-bold">
                    {isPickup ? "الاستلام من المحل" : "التوصيل"}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {isPickup ? "الخطوة الأولى لإكمال الطلب" : "حدد المنطقة ثم أكمل بياناتك"}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <SectionStatusBadge done={true} label="محدد" />
                  {hasStoredDetails ? (
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      تم تعبئة آخر بياناتك تلقائيًا
                    </span>
                  ) : null}
                </div>
              </div>

              <div
                className={cn(
                  "rounded-3xl border p-4 text-right",
                  isPickup
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-primary/20 bg-primary/5",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold">
                      {isPickup ? "استلام من المحل" : "توصيل للمنزل"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {isPickup ? "محدد مسبقًا" : "اختر المنطقة"}
                    </p>
                  </div>
                  {isPickup ? (
                    <Store className="h-5 w-5 text-emerald-700" />
                  ) : (
                    <Truck className="h-5 w-5 text-primary" />
                  )}
                </div>
              </div>

              {hasStoredDetails ? (
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={handleResetRememberedDetails}
                    className="rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:border-primary/30"
                  >
                    ليست بياناتك؟ امسح البيانات المحفوظة
                  </button>
                </div>
              ) : null}

              {!isPickup ? (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-right">
                      <p className="text-sm font-semibold">المنطقة</p>
                    </div>
                    <div className="rounded-full bg-background/70 px-3 py-1 text-xs font-semibold text-primary">
                      {selectedArea ? (
                        <PriceWithRiyalLogo value={selectedArea.price} />
                      ) : (
                        "الرسوم حسب المنطقة"
                      )}
                    </div>
                  </div>

                  <div className="mb-3 flex flex-wrap justify-end gap-2">
                    {quickAreas.map((area) => (
                      <button
                        key={`quick-card-${area.id}`}
                        type="button"
                        onClick={() => pickArea(area.name)}
                        className={cn(
                          "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition-all active:scale-[0.98]",
                          selectedArea?.id === area.id
                            ? "border-primary bg-primary/10 text-primary shadow-sm"
                            : "border-border/70 bg-white/80 text-foreground hover:border-primary/30 hover:bg-white",
                        )}
                      >
                        <PriceWithRiyalLogo value={area.price} />
                        <span className="font-medium">{area.name}</span>
                      </button>
                    ))}
                  </div>

                  <div className="relative rounded-[28px] border border-white/70 bg-white/45 p-3 shadow-[0_10px_30px_rgba(15,23,42,0.04)] backdrop-blur-sm">
                    <MapPin className="absolute right-4 top-4 h-5 w-5 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="ابحث عن المنطقة أو اختر من القائمة *"
                      value={deliveryInfo.area}
                      onFocus={() => setAreaFocused(true)}
                      onBlur={() =>
                        setTimeout(() => setAreaFocused(false), 120)
                      }
                      onChange={(e) =>
                        handleInputChange("area", e.target.value)
                      }
                      className={cn(
                        fieldBaseClass,
                        "pl-20 pr-12",
                        errors.area &&
                          "ring-2 ring-red-300 border border-red-300",
                      )}
                        aria-invalid={Boolean(errors.area)}
                        aria-autocomplete="list"
                    />

                    <div className="pointer-events-none absolute left-6 top-1/2 -translate-y-1/2 rounded-full bg-white/85 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground shadow-sm">
                      {filteredAreas.length} منطقة
                    </div>

                    <div
                      className={cn(
                        "absolute z-20 mt-2 w-full overflow-hidden rounded-[26px] border border-white/80 bg-white/92 shadow-[0_18px_45px_rgba(15,23,42,0.12)] backdrop-blur-xl transition-all duration-200",
                        areaFocused
                          ? "pointer-events-auto translate-y-0 opacity-100"
                          : "pointer-events-none -translate-y-1 opacity-0",
                      )}
                    >
                      <div className="border-b border-border/50 px-4 py-3 text-right">
                        <p className="text-xs font-semibold text-muted-foreground">
                          اختر المنطقة المناسبة للتوصيل
                        </p>
                      </div>
                      <div className="max-h-64 overflow-y-auto py-1">
                        {filteredAreas.length > 0 ? (
                          filteredAreas.map((area) => {
                            const isSelected = selectedArea?.id === area.id;

                            return (
                            <button
                              key={area.id}
                              type="button"
                              onMouseDown={(event) => {
                                event.preventDefault();
                                pickArea(area.name);
                              }}
                              className={cn(
                                "w-full px-4 py-3 text-right transition-all hover:bg-amal-grey/55",
                                isSelected && "bg-primary/5",
                              )}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="text-right">
                                  <p
                                    className={cn(
                                      "font-medium",
                                      isSelected && "text-primary",
                                    )}
                                  >
                                    {area.name}
                                  </p>
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    رسوم التوصيل
                                  </p>
                                </div>
                                <span
                                  className={cn(
                                    "rounded-full px-2.5 py-1 text-xs font-semibold",
                                    isSelected
                                      ? "bg-primary/10 text-primary"
                                      : "bg-muted text-muted-foreground",
                                  )}
                                >
                                  <PriceWithRiyalLogo value={area.price} />
                                </span>
                              </div>
                            </button>
                            );
                          })
                        ) : (
                          <div className="px-4 py-5 text-right text-sm text-muted-foreground">
                            لا توجد منطقة مطابقة، جرّب كتابة اسم آخر.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {errors.area ? (
                    <p
                      className="text-sm font-medium text-red-600 pr-2"
                      role="alert"
                    >
                      {errors.area}
                    </p>
                  ) : null}
                  {selectedArea ? (
                    <p className="text-sm text-right text-primary">
                      <span className="font-semibold">
                        <PriceWithRiyalLogo value={selectedArea.price} />
                      </span>
                    </p>
                  ) : null}
                </div>
              ) : (
                <div className="mt-4 rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-right">
                  <p className="font-semibold text-emerald-800">
                    بدون رسوم توصيل
                  </p>
                </div>
              )}
            </section>
          </div>

          <aside className={asideColumnClass}>
            <section className={cn(theme.summary, "space-y-4 lg:p-6")}>
              <div className="flex items-start justify-between gap-3">
                <div className="text-right">
                  <h2 className="text-lg font-bold">ملخص الطلب المباشر</h2>
                </div>
                <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {isPickup
                    ? "استلام"
                    : selectedArea
                      ? `توصيل ${selectedArea.name}`
                      : "بانتظار المنطقة"}
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className={summaryMutedTextClass}>المجموع الفرعي</span>
                  <span className="font-semibold">
                    <PriceWithRiyalLogo value={totalPrice} />
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className={summaryMutedTextClass}>
                    {isPickup ? "رسوم التوصيل" : "رسوم التوصيل"}
                  </span>
                  <span
                    className={cn(
                      "font-semibold",
                      isPickup && "text-[#1e5631]",
                    )}
                  >
                    {isPickup ? (
                      "مجاني"
                    ) : selectedArea ? (
                      <PriceWithRiyalLogo value={deliveryFee} />
                    ) : (
                      "اختر المنطقة"
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className={summaryMutedTextClass}>إجمالي الخصومات</span>
                  <span
                    className={cn(
                      "font-semibold",
                      discountResult.totalDiscount > 0
                        ? "text-green-600"
                        : summaryMutedTextClass,
                    )}
                  >
                    {discountResult.totalDiscount > 0 ? (
                      <>
                        -
                        <PriceWithRiyalLogo
                          value={discountResult.totalDiscount}
                        />
                      </>
                    ) : (
                      "لا يوجد"
                    )}
                  </span>
                </div>

                <div
                  className={cn(
                    "flex items-center justify-between rounded-2xl border px-4 py-3 transition-transform duration-300",
                    isTotalAnimating && "scale-[1.02]",
                    "border-primary/15 bg-background/75",
                  )}
                >
                  <span className="font-bold">الإجمالي النهائي</span>
                  <span className="font-bold text-primary">
                    {isFinalTotalReady ? (
                      <PriceWithRiyalLogo value={displayGrandTotal} />
                    ) : (
                      "اختر المنطقة"
                    )}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-border/60 bg-background/70 p-3">
                <label className="block text-sm font-medium mb-2 text-right">
                  كود الخصم
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) =>
                      setCouponInput(e.target.value.toUpperCase())
                    }
                    placeholder="WELCOME10"
                    className={cn(
                      "flex-1 h-11 rounded-xl px-3 border border-border text-right",
                      theme.input,
                    )}
                  />
                  <Button
                    type="button"
                    onClick={applyCoupon}
                    className="h-11 rounded-xl px-4"
                  >
                    تطبيق
                  </Button>
                </div>

                {couponStatus ? (
                  <div
                    className={cn(
                      "mt-3 flex items-center justify-between gap-3 rounded-2xl border px-3 py-2 text-sm transition-all duration-300",
                      couponToneClass,
                      couponStatusTone === "success" &&
                        "scale-[1.01] shadow-sm",
                    )}
                  >
                    <span>{couponStatus}</span>
                    {discountResult.codeDiscountAmount > 0 ? (
                      <span className="rounded-full bg-white/70 px-2 py-1 text-xs font-bold text-green-700">
                        وفرت{" "}
                        <PriceWithRiyalLogo
                          value={discountResult.codeDiscountAmount}
                        />
                      </span>
                    ) : null}
                  </div>
                ) : null}

                {activeCouponCode ? (
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                      تم تطبيق {activeCouponCode}
                    </span>
                    <button
                      type="button"
                      onClick={clearCoupon}
                      className="text-xs font-semibold text-primary"
                    >
                      إلغاء الكود
                    </button>
                  </div>
                ) : null}
              </div>
            </section>

            <section className="hidden">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="text-right">
                  <h2 className="text-lg font-bold">طلباتك ({items.length})</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCartExpanded((prev) => !prev)}
                  className="rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground"
                >
                  {isCartExpanded ? "إخفاء الأصناف" : "عرض الأصناف"}
                </button>
              </div>

              {!isCartExpanded ? (
                <div className="rounded-2xl border border-border/60 bg-background/70 px-4 py-3 text-right">
                  <p className="text-sm font-semibold">
                    السلة مختصرة للعرض السريع
                  </p>
                  <p className={cn("mt-1 text-xs", mutedTextClass)}>
                    {items.length} أصناف جاهزة بقيمة{" "}
                    <PriceWithRiyalLogo value={totalPrice} />
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item) => (
                    <div
                      key={item.cartKey}
                      className={cn(
                        "p-3 rounded-2xl border transition-all duration-300",
                        highlightedCartKey === item.cartKey &&
                          "ring-2 ring-primary/30 scale-[1.01]",
                        "bg-background border-border/50",
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <CheckoutItemImage item={item} />
                        <div className="flex-1 min-w-0 text-right">
                          <h3 className="font-bold text-foreground leading-tight break-words">
                            {item.name}
                          </h3>
                          {item.selectedIngredients?.length ? (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {item.selectedIngredients.join("، ")}
                            </p>
                          ) : null}
                          <p className="text-primary font-medium mt-1">
                            <PriceWithRiyalLogo
                              value={item.price * item.quantity}
                            />
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <button
                          onClick={() => handleRemove(item)}
                          className="w-11 h-11 rounded-full bg-destructive/10 flex items-center justify-center text-destructive active:scale-95 transition-transform flex-shrink-0"
                          aria-label="حذف"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDecrease(item)}
                            className={cn(
                              "w-11 h-11 rounded-full flex items-center justify-center active:scale-95 transition-transform",
                              theme.input,
                            )}
                            aria-label="تقليل"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="w-7 text-center font-medium">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleIncrease(item)}
                            className={cn(
                              "w-11 h-11 rounded-full flex items-center justify-center active:scale-95 transition-transform",
                              theme.input,
                            )}
                            aria-label="زيادة"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </aside>
        </div>

        {!canRevealFulfillmentDetails ? (
          <section className={cn(theme.section, "lg:p-6")}>
            <div className="rounded-3xl border border-dashed border-primary/30 bg-primary/5 p-5 text-right">
              <p className="text-sm font-semibold text-primary">
                اختر منطقة التوصيل أولًا
              </p>
            </div>
          </section>
        ) : (
          <>
            <section
              className={cn(
                theme.section,
                "animate-in fade-in slide-in-from-bottom-2 duration-500 lg:p-6",
              )}
              ref={detailsSectionRef}
            >
              <div className="flex items-center justify-between mb-4 gap-3">
                <div className="text-right">
                  <h2 className="text-lg font-bold">
                    {isPickup ? "بيانات الاستلام" : "بيانات التوصيل"}
                  </h2>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <SectionStatusBadge
                    done={infoDone}
                    label={infoDone ? "تم" : "قيد الإكمال"}
                  />
                </div>
              </div>

              {!isPickup && selectedArea ? (
                <div className="mb-4 rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3 text-right">
                  <p className="text-sm font-semibold text-primary">
                    المنطقة المختارة: {selectedArea.name}
                  </p>
                </div>
              ) : null}

              <div className="space-y-3">
                <div className="relative">
                  <User className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="الاسم الكامل *"
                    value={deliveryInfo.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className={cn(
                      fieldBaseClass,
                      errors.name &&
                        "ring-2 ring-red-300 border border-red-300",
                    )}
                    aria-invalid={Boolean(errors.name)}
                  />
                  {errors.name ? (
                    <p
                      className="text-sm font-medium text-red-600 mt-1 pr-2"
                      role="alert"
                    >
                      {errors.name}
                    </p>
                  ) : null}
                </div>

                <div className="relative">
                  <Phone className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    type="tel"
                    inputMode="tel"
                    dir="ltr"
                    placeholder="رقم الهاتف *"
                    value={deliveryInfo.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className={cn(
                      fieldBaseClass,
                      errors.phone &&
                        "ring-2 ring-red-300 border border-red-300",
                    )}
                    aria-invalid={Boolean(errors.phone)}
                  />
                  {errors.phone ? (
                    <p
                      className="text-sm font-medium text-red-600 mt-1 pr-2"
                      role="alert"
                    >
                      {errors.phone}
                    </p>
                  ) : null}
                </div>

                {!isPickup ? (
                  <>
                    <div className="rounded-2xl border border-border/60 bg-background/70 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-right">
                          <p className="text-sm font-semibold">موقع التوصيل</p>
                        </div>
                        <Button
                          type="button"
                          onClick={handleUseCurrentLocation}
                          disabled={isDetectingLocation}
                          variant="outline"
                          className="min-h-11 rounded-full px-4 text-xs font-semibold"
                        >
                          {isDetectingLocation
                            ? "جارٍ التحديد..."
                            : "استخدم موقعي"}
                        </Button>
                      </div>

                      <input
                        type="url"
                        inputMode="url"
                        dir="ltr"
                        placeholder="https://maps.google.com/..."
                        value={deliveryInfo.locationUrl}
                        onChange={(e) =>
                          handleInputChange("locationUrl", e.target.value)
                        }
                        className={cn(
                          "mt-3 h-12 rounded-2xl border border-border px-4 text-left",
                          theme.input,
                        )}
                      />
                    </div>
                  </>
                ) : null}

              </div>
            </section>

            <section
              className={cn(
                theme.section,
                "animate-in fade-in slide-in-from-bottom-2 duration-500 lg:p-6",
              )}
              ref={areaSectionRef}
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="text-right">
                  <h2 className="text-lg font-bold">
                    {isPickup ? "معلومات الاستلام" : "منطقة التوصيل"}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {isPickup
                      ? "لا توجد رسوم توصيل عند الاستلام من المحل"
                      : "اختر المنطقة من القائمة لتحديث الرسوم"}
                  </p>
                </div>
                <SectionStatusBadge
                  done={isPickup || Boolean(selectedArea)}
                  label={isPickup || selectedArea ? "تم" : "مطلوب"}
                />
              </div>

              {isPickup ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-right">
                  <p className="font-semibold text-emerald-800">بدون رسوم توصيل</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative">
                    <MapPin className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <select
                      value={deliveryInfo.area}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (!value) {
                          handleInputChange("area", "");
                          return;
                        }
                        pickArea(value);
                      }}
                      className={cn(
                        fieldBaseClass,
                        "appearance-none pr-12",
                        errors.area &&
                          "ring-2 ring-red-300 border border-red-300",
                      )}
                      aria-invalid={Boolean(errors.area)}
                    >
                      <option value="">اختر منطقة التوصيل *</option>
                      {deliveryAreas.map((area) => (
                        <option key={area.id} value={area.name}>
                          {area.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {errors.area ? (
                    <p
                      className="pr-2 text-sm font-medium text-red-600"
                      role="alert"
                    >
                      {errors.area}
                    </p>
                  ) : null}

                  {selectedArea ? (
                    <div className="rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3 text-right">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-semibold text-primary">
                          {selectedArea.name}
                        </span>
                        <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-primary">
                          <PriceWithRiyalLogo value={selectedArea.price} />
                        </span>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </section>

            <section
              className={cn(
                theme.section,
                "animate-in fade-in slide-in-from-bottom-2 duration-500 lg:p-6",
              )}
              ref={scheduleSectionRef}
            >
              <div className="flex items-center justify-between mb-2 gap-3">
                <div className="text-right">
                  <h2 className="text-lg font-bold">
                    {isPickup ? "وقت الاستلام" : "موعد التوصيل"}
                  </h2>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <SectionStatusBadge
                    done={scheduleDone}
                    label={scheduleBadgeLabel}
                  />
                </div>
              </div>

              {isTodayClosed ? (
                <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-right">
                  <p className="text-sm font-semibold text-red-700">
                    اليوم مغلق لاستقبال الطلبات
                  </p>
                </div>
              ) : null}

              <div className="mb-4 grid grid-cols-1 gap-3">
                <button
                  type="button"
                  onClick={focusSchedulePicker}
                  className={cn(
                    "rounded-2xl border p-3 text-right transition-all active:scale-[0.99]",
                    isScheduled
                      ? "border-primary bg-primary/10"
                      : "border-border bg-background hover:border-primary/30",
                  )}
                >
                  <Clock3
                    className={cn(
                      "mb-2 h-5 w-5",
                      isScheduled ? "text-primary" : "text-muted-foreground",
                    )}
                  />
                  <p className="font-semibold">تحديد وقت</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {deliveryInfo.scheduledTime ?? "اختر الوقت المناسب لك"}
                  </p>
                </button>
              </div>

              {minimumLeadTimeMinutes > 0 ? (
                <div className="mb-3 rounded-xl bg-amal-yellow/20 p-3 text-right text-sm text-foreground">
                  الحد الأدنى للتجهيز:{" "}
                  <span className="font-bold">
                    {formatArabicDuration(minimumLeadTimeMinutes)}
                  </span>
                </div>
              ) : null}

              <div
                ref={schedulePickerRef}
                className={cn(
                  "rounded-3xl transition-all duration-300",
                  isSchedulePickerHighlighted &&
                    "ring-2 ring-primary/30 ring-offset-2 ring-offset-transparent",
                )}
              >
                <TimePicker
                  value={deliveryInfo.scheduledTime}
                  onChange={handleScheduleChange}
                  minMinutes={minimumLeadTimeMinutes}
                  required={false}
                  closedDates={closedDates}
                  openSignal={schedulePickerOpenSignal}
                />
              </div>
              <p className={cn("mt-3 text-right text-sm leading-7", mutedTextClass)}>
                {deliveryAccuracyText}
              </p>
              {errors.scheduledTime ? (
                <p
                  className="mt-2 pr-2 text-sm font-medium text-red-600"
                  role="alert"
                >
                  {errors.scheduledTime}
                </p>
              ) : null}
            </section>

            <section className={cn(theme.section, "lg:p-6")}>
              <div className="mb-4 text-right">
                <div className="text-right">
                  <h2 className="text-lg font-bold">الأصناف ({items.length})</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    راجع الكمية قبل إتمام الطلب
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.cartKey}
                    className={cn(
                      "rounded-2xl border border-border/50 bg-background p-3 transition-all duration-300",
                      highlightedCartKey === item.cartKey &&
                        "scale-[1.01] ring-2 ring-primary/30",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <CheckoutItemImage item={item} />
                      <div className="min-w-0 flex-1 text-right">
                        <h3 className="break-words font-bold text-foreground leading-tight">
                          {item.name}
                        </h3>
                        {item.selectedIngredients?.length ? (
                          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                            {item.selectedIngredients.join("، ")}
                          </p>
                        ) : null}
                        <p className="mt-1 font-medium text-primary">
                          <PriceWithRiyalLogo value={item.price * item.quantity} />
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <button
                        onClick={() => handleRemove(item)}
                        className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive transition-transform active:scale-95"
                        aria-label="حذف"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDecrease(item)}
                          className={cn(
                            "flex h-11 w-11 items-center justify-center rounded-full transition-transform active:scale-95",
                            theme.input,
                          )}
                          aria-label="تقليل"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-7 text-center font-medium">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleIncrease(item)}
                          className={cn(
                            "flex h-11 w-11 items-center justify-center rounded-full transition-transform active:scale-95",
                            theme.input,
                          )}
                          aria-label="زيادة"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className={cn(theme.summary, "space-y-4 lg:p-6")}>
              <div className="flex items-start justify-between gap-3">
                <div className="text-right">
                  <h2 className="text-lg font-bold">الإجمالي</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    آخر خطوة قبل الإرسال إلى واتساب
                  </p>
                </div>
                <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {isPickup
                    ? "استلام"
                    : selectedArea
                      ? `توصيل ${selectedArea.name}`
                      : "بانتظار المنطقة"}
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className={summaryMutedTextClass}>المجموع الفرعي</span>
                  <span className="font-semibold">
                    <PriceWithRiyalLogo value={totalPrice} />
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className={summaryMutedTextClass}>رسوم التوصيل</span>
                  <span className={cn("font-semibold", isPickup && "text-[#1e5631]")}>
                    {isPickup ? (
                      "مجاني"
                    ) : selectedArea ? (
                      <PriceWithRiyalLogo value={deliveryFee} />
                    ) : (
                      "اختر المنطقة"
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className={summaryMutedTextClass}>إجمالي الخصومات</span>
                  <span
                    className={cn(
                      "font-semibold",
                      discountResult.totalDiscount > 0
                        ? "text-green-600"
                        : summaryMutedTextClass,
                    )}
                  >
                    {discountResult.totalDiscount > 0 ? (
                      <>
                        -<PriceWithRiyalLogo value={discountResult.totalDiscount} />
                      </>
                    ) : (
                      "لا يوجد"
                    )}
                  </span>
                </div>

                <div
                  className={cn(
                    "flex items-center justify-between rounded-2xl border border-primary/15 bg-background/75 px-4 py-3 transition-transform duration-300",
                    isTotalAnimating && "scale-[1.02]",
                  )}
                >
                  <span className="font-bold">الإجمالي النهائي</span>
                  <span className="font-bold text-primary">
                    {isFinalTotalReady ? (
                      <PriceWithRiyalLogo value={displayGrandTotal} />
                    ) : (
                      "اختر المنطقة"
                    )}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-border/60 bg-background/70 p-3">
                <label className="mb-2 block text-right text-sm font-medium">
                  كود الخصم
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    placeholder="WELCOME10"
                    className={cn(
                      "h-11 flex-1 rounded-xl border border-border px-3 text-right",
                      theme.input,
                    )}
                  />
                  <Button
                    type="button"
                    onClick={applyCoupon}
                    className="h-11 rounded-xl px-4"
                  >
                    تطبيق
                  </Button>
                </div>

                {couponStatus ? (
                  <div
                    className={cn(
                      "mt-3 flex items-center justify-between gap-3 rounded-2xl border px-3 py-2 text-sm transition-all duration-300",
                      couponToneClass,
                      couponStatusTone === "success" && "scale-[1.01] shadow-sm",
                    )}
                  >
                    <span>{couponStatus}</span>
                    {discountResult.codeDiscountAmount > 0 ? (
                      <span className="rounded-full bg-white/70 px-2 py-1 text-xs font-bold text-green-700">
                        وفرت <PriceWithRiyalLogo value={discountResult.codeDiscountAmount} />
                      </span>
                    ) : null}
                  </div>
                ) : null}

                {activeCouponCode ? (
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                      تم تطبيق {activeCouponCode}
                    </span>
                    <button
                      type="button"
                      onClick={clearCoupon}
                      className="text-xs font-semibold text-primary"
                    >
                      إلغاء الكود
                    </button>
                  </div>
                ) : null}
              </div>
            </section>
          </>
        )}

        <section className="hidden" dir="rtl">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            <h3 className="font-bold text-base">ضمانات الطلب</h3>
          </div>

          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 bg-[#25D366]/10 text-[#1f8f48] text-sm font-semibold hover:bg-[#25D366]/20 transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
            تواصل مباشر للدعم
          </a>
        </section>
      </div>

      <div
        className={theme.ctaWrap}
        style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
      >
        <div className="space-y-3">
          <div
            className={cn(
              "hidden rounded-3xl border px-4 py-3 shadow-lg transition-transform duration-300",
              isTotalAnimating && "scale-[1.01]",
              "border-white/60 bg-white/90 backdrop-blur-md",
            )}
          >
            <div className="mb-2 flex items-center justify-between text-xs font-medium">
              <span className={mutedTextClass}>المجموع الفرعي</span>
              <span>
                <PriceWithRiyalLogo value={totalPrice} />
              </span>
            </div>
            <div className="mb-2 flex items-center justify-between text-xs font-medium">
              <span className={mutedTextClass}>التوصيل</span>
              <span>
                {isPickup ? (
                  "مجاني"
                ) : selectedArea ? (
                  <PriceWithRiyalLogo value={deliveryFee} />
                ) : (
                  "اختر المنطقة"
                )}
              </span>
            </div>
            <div className="mb-3 flex items-center justify-between text-xs font-medium">
              <span className={mutedTextClass}>الخصم</span>
              <span
                className={
                  discountResult.totalDiscount > 0
                    ? "text-green-600"
                    : mutedTextClass
                }
              >
                {discountResult.totalDiscount > 0 ? (
                  <>
                    -<PriceWithRiyalLogo value={discountResult.totalDiscount} />
                  </>
                ) : (
                  "لا يوجد"
                )}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-primary/10 pt-3">
              <span className="text-sm font-bold">الإجمالي النهائي</span>
              <span className="text-lg font-bold text-primary">
                {isFinalTotalReady ? (
                  <PriceWithRiyalLogo value={displayGrandTotal} />
                ) : (
                  "اختر المنطقة"
                )}
              </span>
            </div>
          </div>

          {manualWhatsAppUrl ? (
            <a
              href={manualWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-12 items-center justify-center rounded-full border border-[#25D366]/25 bg-[#25D366]/10 px-4 text-sm font-semibold text-[#1f8f48]"
            >
              فتح واتساب يدويًا
            </a>
          ) : null}

          <Button
            onClick={handleWhatsAppCheckout}
            disabled={checkoutDisabled}
            className="w-full h-14 rounded-full bg-[#25D366] hover:bg-[#25D366]/90 text-white text-lg font-bold shadow-xl disabled:cursor-not-allowed disabled:bg-[#25D366]/60"
          >
            {checkoutButtonLabel}
          </Button>
        </div>
      </div>
    </main>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense>
      <CheckoutContent />
    </Suspense>
  );
}
