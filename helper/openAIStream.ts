import {
    createParser,
    ParsedEvent,
    ReconnectInterval,
} from 'eventsource-parser';

export const openAIStream = async (content: string) => {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        // const response = await fetch('https://openai.teamlint.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'user',
                    content,
                },
            ],
            stream: true,
        }),
    });

    const stream = new ReadableStream({
        async start(controller) {
            const onParse = (event: ParsedEvent | ReconnectInterval) => {
                if (event.type === 'event') {
                    const data = event.data;

                    if (data === '[DONE]') {
                        controller.close();
                        return;
                    }

                    try {
                        const json = JSON.parse(data);
                        const text = json.choices[0].delta.content;
                        const queue = encoder.encode(text);
                        controller.enqueue(queue);
                    } catch (e) {
                        controller.error(e);
                    }
                }
            };

            const parser = createParser(onParse);

            for await (const chunk of response.body as any) {
                parser.feed(decoder.decode(chunk));
            }
        },
    });

    return stream;
};
