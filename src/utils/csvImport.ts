/**
 * Utility functions for parsing CSV files and downloading sample CSV templates.
 */

export interface ParsedParticipant {
  name: string;
  email: string;
  phone?: string;
  role?: string;
  wishlist?: string;
}

export interface ParsedRole {
  name: string;
  count: string;
}

/**
 * Downloads a sample CSV template tailored to the specified event or structure type.
 */
export const downloadCsvTemplate = (
  type: "role-based" | "secret-santa" | "random-positioning" | "roles-only"
) => {
  let content = "";
  let filename = "template.csv";

  if (type === "roles-only") {
    content = "Role,Count\nDeveloper,4\nDesigner,2\nProduct Manager,2\n";
    filename = "roles_structure_template.csv";
  } else if (type === "role-based") {
    content =
      "Name,Email,Role,Phone\nAlice Smith,alice@example.com,Developer,+12345678901\nBob Johnson,bob@example.com,Designer,+12345678902\n";
    filename = "group_pairs_template.csv";
  } else if (type === "secret-santa") {
    content =
      "Name,Email,Phone,Wishlist\nCarol White,carol@example.com,+12345678903,Wireless headphones\nDavid Brown,david@example.com,+12345678904,Coffee maker\n";
    filename = "secret_santa_template.csv";
  } else if (type === "random-positioning") {
    content =
      "Name,Email,Phone\nEva Green,eva@example.com,+12345678905\nFrank Wright,frank@example.com,+12345678906\n";
    filename = "random_positioning_template.csv";
  }

  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Parses raw CSV string content into rows of string arrays, handling quotes and commas correctly.
 */
const parseCsvString = (text: string): string[][] => {
  const lines = text.split(/\r\n|\n|\r/);
  const rows: string[][] = [];

  for (const line of lines) {
    if (!line.trim()) continue;
    const row: string[] = [];
    let insideQuotes = false;
    let currentCell = "";

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === "," && !insideQuotes) {
        row.push(currentCell.trim());
        currentCell = "";
      } else {
        currentCell += char;
      }
    }
    row.push(currentCell.trim());
    rows.push(row);
  }

  return rows;
};

/**
 * Reads a File object as text and parses it into structured participant records.
 */
export const parseParticipantsCsv = async (
  file: File
): Promise<ParsedParticipant[]> => {
  const text = await file.text();
  const rows = parseCsvString(text);

  if (rows.length === 0) return [];

  // Inspect first row for headers
  const headerRow = rows[0].map((h) => h.toLowerCase().replace(/[^a-z]/g, ""));
  const hasHeaders =
    headerRow.includes("name") ||
    headerRow.includes("email") ||
    headerRow.includes("role") ||
    headerRow.includes("phone");

  const startIndex = hasHeaders ? 1 : 0;
  const nameIndex = hasHeaders
    ? headerRow.findIndex((h) => h.includes("name"))
    : 0;
  const emailIndex = hasHeaders
    ? headerRow.findIndex((h) => h.includes("email"))
    : 1;
  const roleIndex = hasHeaders
    ? headerRow.findIndex((h) => h.includes("role") || h.includes("track"))
    : 2;
  const phoneIndex = hasHeaders
    ? headerRow.findIndex(
        (h) => h.includes("phone") || h.includes("whatsapp") || h.includes("mobile")
      )
    : 3;
  const wishlistIndex = hasHeaders
    ? headerRow.findIndex((h) => h.includes("wish"))
    : 4;

  const participants: ParsedParticipant[] = [];

  for (let i = startIndex; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const name = nameIndex >= 0 && row[nameIndex] ? row[nameIndex] : row[0] || "";
    const email = emailIndex >= 0 && row[emailIndex] ? row[emailIndex] : row[1] || "";
    const role = roleIndex >= 0 && row[roleIndex] ? row[roleIndex] : row[2] || "";
    const phone = phoneIndex >= 0 && row[phoneIndex] ? row[phoneIndex] : row[3] || "";
    const wishlist = wishlistIndex >= 0 && row[wishlistIndex] ? row[wishlistIndex] : row[4] || "";

    if (name || email) {
      participants.push({
        name: name.replace(/^"+|"+$/g, ""),
        email: email.replace(/^"+|"+$/g, ""),
        role: role.replace(/^"+|"+$/g, ""),
        phone: phone.replace(/^"+|"+$/g, ""),
        wishlist: wishlist.replace(/^"+|"+$/g, ""),
      });
    }
  }

  return participants;
};

/**
 * Parses a CSV file containing role definitions (Role, Count).
 */
export const parseRolesCsv = async (file: File): Promise<ParsedRole[]> => {
  const text = await file.text();
  const rows = parseCsvString(text);

  if (rows.length === 0) return [];

  const headerRow = rows[0].map((h) => h.toLowerCase().replace(/[^a-z]/g, ""));
  const hasHeaders = headerRow.includes("role") || headerRow.includes("count");
  const startIndex = hasHeaders ? 1 : 0;

  const roles: ParsedRole[] = [];

  for (let i = startIndex; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length < 2) continue;

    const name = (row[0] || "").replace(/^"+|"+$/g, "").trim();
    const count = (row[1] || "").replace(/^"+|"+$/g, "").trim();

    if (name) {
      roles.push({ name, count: count || "1" });
    }
  }

  return roles;
};
