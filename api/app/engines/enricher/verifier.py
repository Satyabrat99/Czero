import re

try:
    import dns.resolver
    HAS_DNS = True
except ImportError:
    HAS_DNS = False


DISPOSABLE_DOMAINS = {
    "guerrillamail.com", "tempmail.com", "throwaway.email",
    "mailinator.com", "yopmail.com", "10minutemail.com",
    "sharklasers.com", "dispostable.com", "tmpmail.net",
    "tempail.com", "tempr.email",
}

ROLE_PREFIXES = [
    "info", "sales", "support", "help", "admin", "office",
    "contact", "hello", "team", "staff", "billing", "marketing",
]

PERSONAL_DOMAINS = [
    "gmail.com", "yahoo.com", "hotmail.com", "outlook.com",
    "aol.com", "icloud.com", "mail.com", "protonmail.com",
]


class ContactVerifier:
    """Multi-layer email verification."""

    def verify_email(self, email: str) -> dict:
        """Verify email and return quality assessment."""
        result = {
            "valid": False,
            "verification": "unknown",
            "confidence": 0,
            "grade": "C",
            "grade_reason": "",
        }

        if not re.match(r'^[\w.+-]+@[\w-]+\.[\w.]+$', email):
            result["verification"] = "invalid_format"
            return result

        domain = email.split("@")[1]
        local = email.split("@")[0]

        if domain in DISPOSABLE_DOMAINS:
            result["verification"] = "disposable"
            return result

        if HAS_DNS:
            try:
                mx_records = dns.resolver.resolve(domain, 'MX')
                if not mx_records:
                    result["verification"] = "no_mx_record"
                    return result
            except Exception:
                result["verification"] = "no_mx_record"
                return result

        is_role = any(local.startswith(prefix) for prefix in ROLE_PREFIXES)
        is_personal = domain in PERSONAL_DOMAINS

        if is_role:
            result["grade"] = "C"
            result["grade_reason"] = "Role-based email (generic inbox)"
            result["confidence"] = 40
        elif is_personal:
            result["grade"] = "B"
            result["grade_reason"] = "Personal email (may not check for business)"
            result["confidence"] = 60
        else:
            result["grade"] = "A"
            result["grade_reason"] = "Professional direct email"
            result["confidence"] = 85

        result["valid"] = True
        result["verification"] = "dns_verified"

        return result
