import { createKilterAuth } from './kilterAuth';
import { databaseSessionStore } from './kilterSessionStore';

/** The app-wide Kilter auth client. Kept apart from `createKilterAuth` so that file stays free of the database. */
export const kilterAuth = createKilterAuth({ store: databaseSessionStore });
