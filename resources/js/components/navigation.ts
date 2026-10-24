import {
  BarcodeIcon,
  BoxesIcon,
  LayoutDashboardIcon,
  MessageSquareTextIcon,
  SendToBackIcon,
  SquareArrowDownLeftIcon,
  UserRoundIcon,
  Users2Icon,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavEntry {
  title: string;
  href: string;
  icon: LucideIcon;
  description?: string;
  keywords?: string[];
  roles?: string[];
}

export interface NavSection {
  label: string;
  items: NavEntry[];
}

export const navigationSections: NavSection[] = [
  {
    label: 'General',
    items: [
      {
        title: 'Dashboard',
        href: '/waredash',
        icon: LayoutDashboardIcon,
        description: 'Warehouse pulse, alerts and recent activity',
        keywords: ['home', 'overview', 'warehouse'],
      },
    ],
  },
  {
    label: 'Inventory',
    items: [
      {
        title: 'Products',
        href: '/products',
        icon: BoxesIcon,
        description: 'Stock levels, pricing and product records',
        keywords: ['stock', 'items', 'catalogue'],
      },
      {
        title: 'Barcodes',
        href: '/barcode',
        icon: BarcodeIcon,
        description: 'Scan history and barcode movements',
        keywords: ['scan', 'labels', 'inbound', 'outbound'],
      },
      {
        title: 'Transfer',
        href: '/transfer',
        icon: SendToBackIcon,
        description: 'Move stock between merchants and agents',
        keywords: ['movement', 'dispatch', 'stock'],
      },
      {
        title: 'Suppliers',
        href: '/units',
        icon: UserRoundIcon,
        description: 'Merchants and supply partners',
        keywords: ['merchants', 'vendors', 'units'],
      },
      {
        title: 'Categories',
        href: '/categories',
        icon: SquareArrowDownLeftIcon,
        description: 'Organise the product catalogue',
        keywords: ['groups', 'catalogue'],
      },
    ],
  },
  {
    label: 'Settings',
    items: [
      {
        title: 'Users',
        href: '/users',
        icon: Users2Icon,
        description: 'Team members and permissions',
        keywords: ['team', 'accounts', 'roles'],
      },
      {
        title: 'WhatsApp Alerts',
        href: '/whatsapp-alerts',
        icon: MessageSquareTextIcon,
        description: 'Inventory alert recipients and delivery history',
        keywords: ['notifications', 'stock', 'messages'],
        roles: ['admin', 'superadmin'],
      },
    ],
  },
];

export function getNavigationForUser(role?: string): NavSection[] {
  return navigationSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => !item.roles || item.roles.includes(role ?? '')),
    }))
    .filter((section) => section.items.length > 0);
}
