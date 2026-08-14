import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";


export type PublicUser = {
  id: number;
  username: string | null;
  avatar: string | null;
};

export type Session = {
  signed_in: boolean;
  user: PublicUser | null;
};


export type LoginProgress =
  | { state: "waiting"; user_code: string; login_url: string; browser_opened: boolean }
  | { state: "needs_guild"; discord_invite: string; message: string }
  | { state: "verifying" }
  | { state: "approved"; user: PublicUser }
  | { state: "expired" }
  | { state: "failed"; message: string };

export function getSession(): Promise<Session> {
  return invoke<Session>("auth_session");
}


export function startSignIn(): Promise<void> {
  return invoke("auth_start");
}

export function cancelSignIn(): Promise<void> {
  return invoke("auth_cancel");
}

export function signOut(): Promise<Session> {
  return invoke<Session>("auth_sign_out");
}

export function onLoginProgress(fn: (p: LoginProgress) => void) {
  return listen<LoginProgress>("auth:progress", (e) => fn(e.payload));
}


export function onSignedOut(fn: (reason: string) => void) {
  return listen<string>("auth:signed-out", (e) => fn(e.payload));
}
