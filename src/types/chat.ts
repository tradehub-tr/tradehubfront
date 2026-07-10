export type ConversationTag = "unread" | "order" | "quote" | "rfq" | "pinned";

export interface Conversation {
  id: string;
  name: string;
  company: string;
  avatar?: string;
  sellerId?: string;
  localTimeHHMM: string;
  online?: boolean;
  lastMessage: string;
  lastTime: string;
  unread: number;
  tags: ConversationTag[];
  muted?: boolean;
  pinned?: boolean;
}

export interface PinnedProduct {
  id: string;
  title: string;
  price: string;
  minOrder: string;
  thumbnail: string;
}

export type MessageDirection = "them" | "me";

export interface TextMessageBody {
  type: "text";
  text: string;
}

export interface ImageMessageBody {
  type: "image";
  url: string;
  width?: number;
  height?: number;
  caption?: string;
}

export interface FileMessageBody {
  type: "file";
  name: string;
  size: number;
  mimeType: string;
  url: string;
}

export interface OrderMessageBody {
  type: "order";
  orderId: string;
  product: PinnedProduct;
  status: string;
  total: string;
  shippingDate: string;
  address: string;
}

export interface SystemMessageBody {
  type: "system";
  text: string;
}

export type MessageBody =
  | TextMessageBody
  | ImageMessageBody
  | FileMessageBody
  | OrderMessageBody
  | SystemMessageBody;

export interface Message {
  id: string;
  conversationId: string;
  direction: MessageDirection;
  body: MessageBody;
  time: string;
  dateLabel?: string;
  read: boolean;
  pending?: boolean;
  /** Jitsi görüntülü görüşme daveti URL'i — mesaj 🎥 marker'ı içeriyorsa
   *  buyer/seller tarafı bunu "Görüşmeye Katıl" butonu olarak render eder. */
  videoCallUrl?: string;
  /** Mesaj bir ürün bağlamıyla gönderildiyse ([Ürün ...] marker'ı) chip olarak
   *  render edilir — hangi ürün hakkında konuşulduğu geçmişte kaybolmasın. */
  productRef?: ProductRef;
}

export interface ProductRef {
  /** Marker'daki listing id — pin barını geçmişten geri kurmak için. */
  id?: string;
  /** Ürün detay linki (marker'daki listing id'den üretilir; id yoksa boş). */
  url: string;
  /** "başlık • fiyat • Min. Sipariş: N" görünür metni. */
  label: string;
}

export type SubMenuKey =
  | "emoji"
  | "photo"
  | "file"
  | "call"
  | "card"
  | "location"
  | "translate"
  | "context";

export interface QuickAction {
  id: string;
  label: string;
  handler: string;
}

export type ChatTab = "chat" | "inbox";
