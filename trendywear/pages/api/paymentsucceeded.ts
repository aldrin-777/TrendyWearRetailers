import type { NextApiRequest, NextApiResponse } from 'next'

const payrexSecretApiKey = process.env.PAYREX_SECRET_KEY;

if (!payrexSecretApiKey) {
    throw new Error("Missing PAYREX_SECRET_KEY");
}

const Payrex = require('payrex-node');
const payrex = Payrex(payrexSecretApiKey);

type ResponseData = {
  message: string
}
 
export default function handler ( req: NextApiRequest, res: NextApiResponse<ResponseData>) {
    if (req.method === 'POST') {
        res.status(200).json({ message: "'tis a post!" })
    }
    else{
        res.status(200).json({ message: 'Hello from Next.js!!' })
    }
}