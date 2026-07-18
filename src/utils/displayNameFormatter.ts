export class DisplayNameFormatter {
  public static format(
    name: string,
  ): string {
    const normalizedName =
      name
        .replace(/_/g, ' ')
        .replace(
          /^(température|temperature)\s+/i,
          '',
        )
        .replace(
          /\s+(température|temperature)$/i,
          '',
        )
        .trim();

    if (
      normalizedName.length === 0
    ) {
      return name;
    }

    return (
      normalizedName
        .charAt(0)
        .toUpperCase() +
      normalizedName.slice(1)
    );
  }
}