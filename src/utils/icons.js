import {
  Gamepad,
  Globe,
  Instagram,
  Monitor,
  Shield,
  Smartphone,
  Twitter,
  Facebook,
} from "lucide-react";

// Maps social/app names to matching lucide icons
export const getIcon = (name, size = 24, className = "") => {
  const props = { size, className };
  const safeName = typeof name === "string" ? name.toLowerCase() : "globe";

  switch (safeName) {
    case "instagram":
      return <Instagram {...props} />;
    case "twitter":
      return <Twitter {...props} />;
    case "facebook":
      return <Facebook {...props} />;
    case "smartphone":
      return <Smartphone {...props} />;
    case "gamepad":
      return <Gamepad {...props} />;
    case "monitor":
      return <Monitor {...props} />;
    case "globe":
      return <Globe {...props} />;
    case "mindful":
      return <Shield {...props} />;
    default:
      return <Globe {...props} />;
  }
};

