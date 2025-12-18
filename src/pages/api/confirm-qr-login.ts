import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ status: false, error: "Method not allowed" });
    }

    const { sessionId, accessToken, confirmUrl } = req.body;

    if (!sessionId || !accessToken || !confirmUrl) {
        return res.status(400).json({
            status: false,
            error: "Session ID, access token, and confirm URL are required",
        });
    }

    try {
        // Forward the access token to san app's API
        const response = await fetch(confirmUrl, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                sessionId,
                accessToken,
            }),
        });

        const data = await response.json();

        if (!response.ok || !data.status) {
            return res.status(response.status).json({
                status: false,
                error: data.error || "Failed to confirm login",
            });
        }

        return res.status(200).json({
            status: true,
            message: "Login confirmed successfully",
        });
    } catch (error: any) {
        console.error("Error confirming QR login:", error);
        return res.status(500).json({
            status: false,
            error: "Failed to confirm login: " + error.message,
        });
    }
}
