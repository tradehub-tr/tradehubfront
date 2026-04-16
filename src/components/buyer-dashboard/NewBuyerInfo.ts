/**
 * NewBuyerInfo Component
 * White card composing UserInfoCard + OperationSlider.
 * Slider fetches banners dynamically from API — hidden if no banners exist.
 */

import type { UserProfile } from "../../types/buyerDashboard";
import { UserInfoCard } from "./UserInfoCard";
import { OperationSlider } from "./OperationSlider";

export interface NewBuyerInfoProps {
  user: UserProfile;
}

export function NewBuyerInfo(props: NewBuyerInfoProps): string {
  return `
    <div class="bg-(--color-surface,#ffffff) rounded-lg overflow-hidden transition-shadow duration-300 hover:shadow-[0_0_12px_0_rgba(0,0,0,0.12)]">
      ${UserInfoCard({ user: props.user })}
      ${OperationSlider()}
    </div>
  `;
}
