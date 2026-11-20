const KEY = "MUST_CHANGE_PASSWORD";

export function setMustChangePassword(value: boolean) {
  if (value) sessionStorage.setItem(KEY, "1");
  else sessionStorage.removeItem(KEY);
}

export function getMustChangePassword() {
  return sessionStorage.getItem(KEY) === "1";
}
