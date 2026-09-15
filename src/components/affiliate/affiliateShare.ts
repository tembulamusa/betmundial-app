import { Linking, Share } from "react-native";

export const AFFILIATE_SHARE_IMAGE_URL = null;

async function writeClipboard(text: string): Promise<boolean> {
    try {
        const community = require("@react-native-clipboard/clipboard").default;
        if (community?.setString) {
            community.setString(text);
            return true;
        }
    } catch {
        /* fall through */
    }
    try {
        const { Clipboard } = require("react-native");
        if (Clipboard?.setString) {
            Clipboard.setString(text);
            return true;
        }
    } catch {
        /* fall through */
    }
    return false;
}

export function getAffiliateShareUrl(code?: string | null) {
    if (!code) return "https://betmundial.com/signup";
    return `https://betmundial.com/signup/${encodeURIComponent(String(code))}`;
}

export function buildAffiliateSharePayload(code?: string | null) {
    const promoCode = String(code || "").trim();
    const shareUrl = getAffiliateShareUrl(promoCode);
    const shareTextShort = promoCode
        ? `Join Betmundial with my affiliate code ${promoCode} — sign up and start winning!`
        : "Join Betmundial — sign up and start winning!";
    const shareText = `${shareTextShort} ${shareUrl}`;

    return {
        promoCode,
        shareUrl,
        shareText,
        shareTextShort,
        shareImageUrl: AFFILIATE_SHARE_IMAGE_URL,
    };
}

export function getPlatformShareUrl(
    platform: string,
    payload: ReturnType<typeof buildAffiliateSharePayload>
) {
    const { shareUrl, shareText, shareTextShort } = payload;
    const textEncoded = encodeURIComponent(shareText);
    const shortEncoded = encodeURIComponent(shareTextShort);
    const urlEncoded = encodeURIComponent(shareUrl);

    switch (platform) {
        case "whatsapp":
            return `https://wa.me/?text=${textEncoded}`;
        case "facebook":
            return `https://www.facebook.com/sharer/sharer.php?u=${urlEncoded}&quote=${shortEncoded}`;
        case "x":
            return `https://twitter.com/intent/tweet?text=${shortEncoded}&url=${urlEncoded}`;
        case "instagram":
            return "https://www.instagram.com/";
        default:
            return null;
    }
}

export async function openAffiliateSocialShare(
    platform: string,
    code?: string | null
): Promise<{ ok: boolean; hint: string }> {
    const payload = buildAffiliateSharePayload(code);
    if (!payload.promoCode) {
        return { ok: false, hint: "No affiliate code to share." };
    }

    if (platform === "copy-code") {
        const ok = await writeClipboard(payload.promoCode);
        return {
            ok,
            hint: ok ? "Code copied." : "Unable to copy code.",
        };
    }

    if (platform === "copy") {
        const ok = await writeClipboard(payload.shareUrl);
        return {
            ok,
            hint: ok ? "Copied!" : "Unable to copy link.",
        };
    }

    if (platform === "instagram") {
        const ok = await writeClipboard(payload.shareText);
        const ig = getPlatformShareUrl("instagram", payload);
        if (ig) {
            try {
                await Linking.openURL(ig);
            } catch {
                /* ignore open failure if copy succeeded */
            }
        }
        return {
            ok,
            hint: ok
                ? "Invite copied — paste it in an Instagram DM, Story, or post."
                : "Unable to copy. Please share your code manually.",
        };
    }

    if (platform === "native") {
        try {
            await Share.share({
                message: payload.shareText,
                url: payload.shareUrl,
            });
            return { ok: true, hint: "" };
        } catch {
            return { ok: false, hint: "Unable to open share." };
        }
    }

    const shareUrl = getPlatformShareUrl(platform, payload);
    if (shareUrl) {
        try {
            await Linking.openURL(shareUrl);
            return { ok: true, hint: "" };
        } catch {
            return { ok: false, hint: "Unable to open share." };
        }
    }

    return { ok: false, hint: "Unable to open share." };
}
