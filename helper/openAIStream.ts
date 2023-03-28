export const openAIStream = async (content: string) => {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    // const response = await fetch('https://api.openai.com/v1/chat/completions', {
    const response = await fetch(
        'https://openai.teamlint.com/v1/chat/completions',
        {
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
        }
    );

    return response.body;
};
