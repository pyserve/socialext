import { getValidAccessToken } from "@/lib/zoho";
import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

type ZohoLead = {
  id: string;
  [key: string]: any;
};

type ZohoResponse = {
  data: ZohoLead[];
  info?: any;
};

export async function POST(req: NextRequest) {
  const token = await getValidAccessToken();
  console.log("🚀 ~ GET ~ token:", token);

  const data = await req.json();
  console.log("Received data:", data);

  if (!token || !process.env.ZOHO_ORG_ID) {
    return NextResponse.json(
      { error: "Missing access token or organization ID" },
      { status: 500 }
    );
  }

  try {
    const response = await axios.post<ZohoResponse>(
      `https://www.zohoapis.com/crm/v2/Leads`,
      {
        data: [data],
      },
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${token}`,
          "Content-Type": "application/json",
          "X-CRM-ORG": process.env.ZOHO_ORG_ID,
        },
      }
    );
    return NextResponse.json(response.data, { status: 200 });
  } catch (error: any) {
    console.log("🚀 ~ POST ~ error:", error);
    console.error(
      "Error creating leads:",
      error.response?.data || error.message
    );
    return NextResponse.json(
      { error: "Failed to create leads" },
      { status: error.response?.status || 500 }
    );
  }
}
