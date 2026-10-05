import { describe, it, expect } from "vitest";
import { csvCell, fileStem, toCsv } from "../../src/utils/csv";
import { PAID_OVERDRAFT, balanceFloor, canSpendFrom, isPaidLedger } from "../../src/utils/tokens";
import { isEmail } from "../../src/utils/validation";
import { formatWhatsAppPhone } from "../../src/utils/phone";

describe("csv", () => {
  it("quotes every cell and doubles embedded quotes", () => {
    expect(csvCell('Ada "The Countess" Lovelace')).toBe('"Ada ""The Countess"" Lovelace"');
    expect(csvCell(undefined)).toBe('""');
    expect(csvCell(3)).toBe('"3"');
  });

  it("stops spreadsheet formulas in participant-supplied text from running", () => {
    expect(csvCell("=HYPERLINK(\"http://evil\")")).toBe('"\'=HYPERLINK(""http://evil"")"');
    expect(csvCell("+1")).toBe('"\'+1"');
    expect(csvCell("@cmd")).toBe('"\'@cmd"');
  });

  it("keeps commas and line breaks inside one cell", () => {
    expect(toCsv(["Name", "Wishlist"], [["Ben", "books, tea\nsocks"]])).toBe('"Name","Wishlist"\r\n"Ben","books, tea\nsocks"\r\n');
  });

  it("builds safe file names", () => {
    expect(fileStem("Team Day: 2026 / Lagos")).toBe("Team_Day_2026_Lagos");
    expect(fileStem(undefined)).toBe("event");
  });
});

describe("token rules", () => {
  it("treats any non-free tier or a past purchase as paid", () => {
    expect(isPaidLedger({ tier: "free", hasEverPaid: false })).toBe(false);
    expect(isPaidLedger({ tier: "free", hasEverPaid: true })).toBe(true);
    expect(isPaidLedger({ tier: "pro" })).toBe(true);
    expect(isPaidLedger(null)).toBe(false);
  });

  it("gives paid accounts an overdraft and free accounts none", () => {
    expect(balanceFloor({ tier: "free" })).toBe(0);
    expect(balanceFloor({ tier: "paid" })).toBe(-PAID_OVERDRAFT);
    expect(canSpendFrom({ tier: "free", balance: 1 }, 1)).toBe(true);
    expect(canSpendFrom({ tier: "free", balance: 0 }, 1)).toBe(false);
    expect(canSpendFrom({ tier: "paid", balance: -19 }, 1)).toBe(true);
    expect(canSpendFrom({ tier: "paid", balance: -20 }, 1)).toBe(false);
  });
});

describe("validation and phone formatting", () => {
  it("accepts plausible emails only", () => {
    expect(isEmail("ada@example.com")).toBe(true);
    expect(isEmail("ada@example")).toBe(false);
    expect(isEmail("ada example@x.com")).toBe(false);
  });

  it("normalises Nigerian local numbers to international digits", () => {
    expect(formatWhatsAppPhone("0801 234 5678")).toBe("2348012345678");
    expect(formatWhatsAppPhone("8012345678")).toBe("2348012345678");
    expect(formatWhatsAppPhone("+234 801 234 5678")).toBe("2348012345678");
    expect(formatWhatsAppPhone("")).toBe("");
  });
});
