export const TaxService = {
  /**
   * Calculates tax cost based on subtotal, state, and country.
   * Supports standard GST/VAT rates and US state sales taxes.
   */
  async calculateTax(subtotal: number, state: string, country: string): Promise<number> {
    const upperCountry = country.trim().toUpperCase();
    const upperState = state.trim().toUpperCase();

    // Default rate: 18% GST (standard for premium accessories in India)
    let taxRate = 0.18;

    if (upperCountry === "INDIA") {
      taxRate = 0.18;
    } else if (upperCountry === "USA" || upperCountry === "UNITED STATES") {
      // US State Taxes
      const stateTaxRates: Record<string, number> = {
        NY: 0.08875,
        "NEW YORK": 0.08875,
        CA: 0.0825,
        "CALIFORNIA": 0.0825,
        TX: 0.0625,
        "TEXAS": 0.0625,
        FL: 0.06,
        "FLORIDA": 0.06,
      };
      taxRate = stateTaxRates[upperState] || 0.07; // Default US sales tax is 7% if state unknown
    } else if (["UK", "UNITED KINGDOM", "GB", "GREAT BRITAIN"].includes(upperCountry)) {
      taxRate = 0.20; // 20% UK VAT
    } else {
      taxRate = 0.15; // 15% flat international tax
    }

    return Math.round(subtotal * taxRate * 100) / 100;
  }
};
