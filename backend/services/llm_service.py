from typing import Optional, List, Dict, Any
import httpx
from dotenv import load_dotenv

load_dotenv()


class LLMService:
    ALLOWED_GROQ_MODELS = ["llama3-8b-8192", "llama3-70b-8192", "llama-3.1-8b-instant", "llama-3.1-70b-versatile", "llama-3.3-70b-versatile"]

    def generate_response(
        self,
        query: str,
        api_key: str,
        model: str = "llama-3.1-8b-instant",
        context: Optional[List[str]] = None,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 1024,
        web_search_results: Optional[List[str]] = None,
    ) -> str:
        if model not in self.ALLOWED_GROQ_MODELS:
            raise ValueError(f"Only Groq models are allowed. Use one of: {', '.join(self.ALLOWED_GROQ_MODELS)}")

        if not api_key:
            raise ValueError("LLM API key is required for Groq completion.")

        if not api_key.startswith("gsk_"):
            raise ValueError("Invalid Groq API key format. It should start with 'gsk_'.")

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

        groq_api_url = "https://api.groq.com/openai/v1/chat/completions"
        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        response = httpx.post(
            groq_api_url,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=60.0,
        )

        if response.status_code != 200:
            try:
                err = response.json()
                detail = err.get("error", err)
            except Exception:
                detail = response.text
            raise ValueError(f"Groq API error ({response.status_code}): {detail}")

        data = response.json()
        if "choices" not in data or not data["choices"]:
            raise ValueError("Groq API returned no choices.")

        return data["choices"][0]["message"]["content"]

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
