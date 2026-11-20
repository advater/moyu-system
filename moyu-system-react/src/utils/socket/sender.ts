import type { Business } from "./business";

let _business: Business | null = null;

export function setBusinessSender(business: Business): void {
  _business = business;
}

export function getBusinessSender(): Business {
  return _business!;
}