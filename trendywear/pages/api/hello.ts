import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'; 

type ResponseData = { message: string }

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Check if body exists
    if (!req.body) {
      return res.status(400).json({ message: "No request body received" });
    }

    const body = req.body;

    // Safe extraction using optional chaining
    const amount = body.data?.amount ?? "No amount found";
    const userId = body.data?.metadata?.user_id ?? "No User ID in metadata";

    return res.status(200).json({
      message: `Received data: [Amount: ${amount}, User ID: ${userId}]`
    });

  } catch (error) {
    console.error("Handler error:", error);

    return res.status(500).json({
      message: `Internal server error: ${error}`
    });
  }
}