from openai import OpenAI
from typing import Optional, List, Dict, Any
import httpx
from dotenv import load_dotenv

load_dotenv()


class LLMService:
    def generate_response(
        self,
        query: str,
        api_key: str,
        model: str = "gpt-3.5-turbo",
        context: Optional[List[str]] = None,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 1024,
        web_search_results: Optional[List[str]] = None,
    ) -> str:
        client = OpenAI(api_key=api_key)

        messages = []

        if system_prompt:
            messages.append({
                "role": "system",
                "content": system_prompt
            })
        else:
            messages.append({
                "role": "system",
                "content": "You are a helpful AI assistant."
            })

        user_message = query

        if context:
            context_text = "\n\n".join(context)
            user_message = f"Context:\n{context_text}\n\nQuestion: {query}"

        if web_search_results:
            search_text = "\n\n".join(web_search_results)
            user_message = f"Web Search Results:\n{search_text}\n\n{user_message}"

        messages.append({
            "role": "user",
            "content": user_message
        })

        response = client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )

        return response.choices[0].message.content

    async def web_search(
        self,
        query: str,
        api_key: str,
        num_results: int = 3
    ) -> List[str]:
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    "https://serpapi.com/search",
                    params={
                        "q": query,
                        "api_key": api_key,
                        "num": num_results,
                    }
                )

                if response.status_code == 200:
                    data = response.json()
                    results = []

                    if "organic_results" in data:
                        for result in data["organic_results"][:num_results]:
                            snippet = result.get("snippet", "")
                            title = result.get("title", "")
                            results.append(f"{title}: {snippet}")

                    return results

                return []
        except Exception as e:
            print(f"Error performing web search: {e}")
            return []
