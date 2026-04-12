// Edge case: component that owns its own Context.Provider
// and has a deeply nested consumer in same file

import van from "@michthemaker/vanjs";
import { UserContext, useUser } from "./context-test";

const { div, p, span, strong } = van.tags;

// Deep consumer — no Provider above it in its own file
// relies on snapshot replay during HMR rerender
const UserBadge = () => {
  const user = useUser();
  return span(
    { style: "background: #eee; padding: 4px 8px; border-radius: 4px;" },
    strong(user.role + "me and you"),
    " — ",
    user.username
  );
};

// Owns the Provider + renders UserBadge inside it
const UserProfile = () => {
  const userState = van.state({ username: "michthemaker", role: "admin" });
  return UserContext.Provider(userState, () =>
    div(
      { style: "border: 1px solid #ccc; padding: 12px; margin-top: 12px;" },
      p("UserProfile component owns this Provider"),
      UserBadge(),
      p(() => `role is: ${userState.val.role}`)
    )
  );
};

export { UserProfile, UserBadge };
