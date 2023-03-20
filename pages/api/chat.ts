import { NextRequest } from 'next/server';
import { openAIStream } from '../../helper/openAIStream';

export const config = {
    runtime: 'edge',
};
export default async function handler(req: NextRequest) {
    try {
        const { message } = await req.json();
        const stream = await openAIStream(message);
        return new Response(stream);
    } catch (e) {
        console.log(e);
        return new Response('Error', { status: 500 });
    }
}
