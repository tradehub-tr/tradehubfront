/**
 * RFQ Page Mock Data
 * Internationalized mock data for all RFQ page sections — B2B marketplace style.
 */

import { t } from "../i18n";
import type { CustomizationCard, Testimonial } from "../types/rfq";

export function getCustomizationCards(): CustomizationCard[] {
  return [
    {
      id: "card-1",
      title: t("mockData.rfqData.custCard1Title"),
      subtitle: t("mockData.rfqData.custCard1Subtitle"),
      icon: "🎨",
      position: 1,
    },
    {
      id: "card-2",
      title: t("mockData.rfqData.custCard2Title"),
      subtitle: t("mockData.rfqData.custCard2Subtitle"),
      icon: "🏷️",
      position: 2,
    },
    {
      id: "card-3",
      title: t("mockData.rfqData.custCard3Title"),
      subtitle: t("mockData.rfqData.custCard3Subtitle"),
      icon: "📦",
      position: 3,
    },
    {
      id: "card-4",
      title: t("mockData.rfqData.custCard4Title"),
      subtitle: t("mockData.rfqData.custCard4Subtitle"),
      icon: "🎁",
      position: 4,
    },
  ];
}

export function getTestimonials(): Testimonial[] {
  return [
    {
      id: "testimonial-1",
      quote: t("mockData.rfqData.testimonial1Quote"),
      avatar: "",
      name: t("mockData.rfqData.testimonial1Name"),
      title: t("mockData.rfqData.testimonial1Title"),
      company: t("mockData.rfqData.testimonial1Company"),
    },
    {
      id: "testimonial-2",
      quote: t("mockData.rfqData.testimonial2Quote"),
      avatar: "",
      name: t("mockData.rfqData.testimonial2Name"),
      title: t("mockData.rfqData.testimonial2Title"),
      company: t("mockData.rfqData.testimonial2Company"),
    },
    {
      id: "testimonial-3",
      quote: t("mockData.rfqData.testimonial3Quote"),
      avatar: "",
      name: t("mockData.rfqData.testimonial3Name"),
      title: t("mockData.rfqData.testimonial3Title"),
      company: t("mockData.rfqData.testimonial3Company"),
    },
  ];
}
