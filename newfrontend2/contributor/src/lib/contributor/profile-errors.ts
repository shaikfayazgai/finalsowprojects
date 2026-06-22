/** Profile-domain fetch errors (skills, twin) — not tied to contributor mock API. */
export class ContributorProfileError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ContributorProfileError";
  }
}
