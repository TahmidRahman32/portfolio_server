export const userSearchAbleFields = ["email"];
export const productSearchAbleFields = ["name", "brand", "category"];

export interface IOrderUserPayload {
   status: string; // e.g., "PROCESSING", "COMPLETED", "CANCELLED"
   // optionally other updatable fields (name, address, etc.)
}
