/**
 * Inquiries & RFQ Dashboard Mock Data
 * Mock data for "My Inquiries" and "My RFQs" tabs.
 */

import { t } from '../i18n';

export interface MockInquiry {
  id: string;
  date: string;
  message: string;
  sellerName: string;
  sellerCompany: string;
  sellerAvatar: string;
}

export interface MockRFQ {
  id: string;
  title: string;
  quotationFrom: string;
  quotationCompany: string;
  quotationAvatar: string;
  status: 'Pending' | 'Approved' | 'Closed' | 'Rejected' | 'Completed' | 'Not Paid';
  date: string;
}

export function getMockInquiries(): MockInquiry[] {
  return [
    {
      id: 'INQ-20260325-001',
      date: '2026-03-25 09:39',
      message: 'Toptan tekstil ürünleri hakkında bilgi talebi',
      sellerName: 'Mehmet Yılmaz',
      sellerCompany: 'İstanbul Tekstil A.Ş.',
      sellerAvatar: '',
    },
    {
      id: 'INQ-20260322-002',
      date: '2026-03-22 14:15',
      message: 'Deri aksesuar fiyat bilgisi',
      sellerName: 'Ayşe Kara',
      sellerCompany: 'Anadolu Deri Ltd.',
      sellerAvatar: '',
    },
    {
      id: 'INQ-20260318-003',
      date: '2026-03-18 11:00',
      message: 'Ambalaj malzemesi toptan sipariş',
      sellerName: 'Ali Demir',
      sellerCompany: 'Demir Ambalaj San.',
      sellerAvatar: '',
    },
    {
      id: 'INQ-20260310-004',
      date: '2026-03-10 16:42',
      message: 'Elektronik bileşen tedarik talebi',
      sellerName: 'Fatma Çelik',
      sellerCompany: 'TechParts Elektronik',
      sellerAvatar: '',
    },
  ];
}

export function getMockRFQs(): MockRFQ[] {
  return [
    {
      id: 'RFQ-20260328-001',
      title: '500 adet özel tasarım pamuklu t-shirt',
      quotationFrom: 'İstanbul Tekstil A.Ş.',
      quotationCompany: 'İstanbul Tekstil A.Ş.',
      quotationAvatar: '',
      status: 'Pending',
      date: '2026-03-28',
    },
    {
      id: 'RFQ-20260320-002',
      title: '1000 adet karton kutu (30x20x15cm)',
      quotationFrom: 'Demir Ambalaj San.',
      quotationCompany: 'Demir Ambalaj San.',
      quotationAvatar: '',
      status: 'Approved',
      date: '2026-03-20',
    },
    {
      id: 'RFQ-20260315-003',
      title: 'LED panel aydınlatma toptan sipariş',
      quotationFrom: 'TechParts Elektronik',
      quotationCompany: 'TechParts Elektronik',
      quotationAvatar: '',
      status: 'Closed',
      date: '2026-03-15',
    },
    {
      id: 'RFQ-20260305-004',
      title: 'Organik pamuk kumaş 2000 metre',
      quotationFrom: '',
      quotationCompany: '',
      quotationAvatar: '',
      status: 'Pending',
      date: '2026-03-05',
    },
  ];
}

export const UOM_OPTIONS = [
  'pieces', 'bags', 'barrels', 'blades', 'boxes', 'bushels', 'cartons',
  'centimeters', 'cubic meters', 'dozens', 'feet', 'gallons', 'grams',
  'inches', 'kilograms', 'kilometers', 'liters', 'long tons', 'meters',
  'metric tons', 'milligrams', 'milliliters', 'millimeters', 'ounces',
  'packs', 'pairs', 'pallets', 'pounds', 'reams', 'rolls', 'sets',
  'sheets', 'short tons', 'square feet', 'square meters', 'tons',
  'units', 'yards',
];
