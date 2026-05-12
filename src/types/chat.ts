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
}

export type SubMenuKey = "emoji" | "photo" | "file" | "call" | "card" | "location" | "translate" | "context";

export interface QuickAction {
  id: string;
  label: string;
  handler: string;
}

export type ChatTab = "chat" | "inbox";
