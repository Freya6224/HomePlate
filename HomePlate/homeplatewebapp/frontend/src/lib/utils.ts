import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getOrdersWebSocketUrl(apiUrl: string | undefined): string | null {
  if (!apiUrl) return null
  return apiUrl.replace(/^http/, "ws") + "/api/ws"
}