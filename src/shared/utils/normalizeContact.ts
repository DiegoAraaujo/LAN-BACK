export const normalizeContact = (type: string, value: string) => {
  if (type === "WHATSAPP") {
    return value.replace(/\D/g, "");
  }

  if (type === "INSTAGRAM") {
    return value.replace("@", "").toLowerCase();
  }

  return value;
};
