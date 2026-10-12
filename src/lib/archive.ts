// Archived-event mode. Once the party is over, set FBW_ARCHIVED=1 on the deployment and
// the app becomes a read-only record of the night: every write is refused on the server,
// nobody can sign in as a guest or act as host, and the UI drops its edit controls.
// Unset it (and redeploy) to reuse the app for another party.

export function isArchived(): boolean {
  return process.env.FBW_ARCHIVED === "1";
}

export class ArchivedError extends Error {
  constructor() {
    super("The party's over. This is a read-only archive.");
  }
}

export function assertNotArchived() {
  if (isArchived()) throw new ArchivedError();
}
