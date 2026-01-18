from typing import Dict, Any, List, Optional
from .document_processor import DocumentProcessor
from .embedding_service import EmbeddingService
from .vector_store import VectorStore
from .llm_service import LLMService
from database import get_supabase_client


class WorkflowExecutor:
    def __init__(
        self,
        document_processor: DocumentProcessor,
        embedding_service: EmbeddingService,
        vector_store: VectorStore,
        llm_service: LLMService,
    ):
        self.document_processor = document_processor
        self.embedding_service = embedding_service
        self.vector_store = vector_store
        self.llm_service = llm_service
        self.supabase = get_supabase_client()

    async def execute(
        self,
        workflow_data: Dict[str, Any],
        query: str,
        stack_id: str,
        session_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        try:
            nodes = workflow_data.get("nodes", [])
            edges = workflow_data.get("edges", [])

            execution_log = {
                "query": query,
                "steps": []
            }

            node_map = {node["id"]: node for node in nodes}
            edge_map = {}
            for edge in edges:
                source = edge["source"]
                if source not in edge_map:
                    edge_map[source] = []
                edge_map[source].append(edge["target"])

            user_query_node = next((n for n in nodes if n["type"] == "userQuery"), None)
            if not user_query_node:
                raise ValueError("No User Query node found in workflow")

            execution_log["steps"].append({
                "node_id": user_query_node["id"],
                "node_type": "userQuery",
                "input": query,
                "output": query
            })

            current_node_id = user_query_node["id"]
            context: Optional[List[str]] = None
            web_search_results: Optional[List[str]] = None

            while current_node_id in edge_map:
                next_node_ids = edge_map[current_node_id]
                if not next_node_ids:
                    break

                next_node_id = next_node_ids[0]
                next_node = node_map.get(next_node_id)

                if not next_node:
                    break

                node_type = next_node["type"]
                node_config = next_node.get("data", {}).get("config", {})

                if node_type == "knowledgeBase":
                    context = await self._process_knowledge_base(
                        stack_id=stack_id,
                        query=query,
                        config=node_config,
                        execution_log=execution_log,
                        node_id=next_node_id
                    )

                elif node_type == "llmEngine":
                    response = await self._process_llm_engine(
                        query=query,
                        context=context,
                        web_search_results=web_search_results,
                        config=node_config,
                        execution_log=execution_log,
                        node_id=next_node_id
                    )

                    return {
                        "response": response,
                        "status": "success",
                        "execution_data": execution_log
                    }

                elif node_type == "output":
                    execution_log["steps"].append({
                        "node_id": next_node_id,
                        "node_type": "output",
                        "message": "Response delivered to user"
                    })

                current_node_id = next_node_id

            return {
                "response": "",
                "status": "error",
                "error_message": "Workflow completed but no LLM Engine node was found to generate a response. Please add an LLM Engine node to your workflow.",
                "execution_data": execution_log
            }

        except Exception as e:
            return {
                "response": "",
                "status": "error",
                "error_message": str(e),
                "execution_data": execution_log if 'execution_log' in locals() else {}
            }

    async def _process_knowledge_base(
        self,
        stack_id: str,
        query: str,
        config: Dict[str, Any],
        execution_log: Dict[str, Any],
        node_id: str
    ) -> List[str]:
        result = self.supabase.table("documents").select("id").eq("stack_id", stack_id).execute()

        if not result.data:
            execution_log["steps"].append({
                "node_id": node_id,
                "node_type": "knowledgeBase",
                "message": "No documents found",
                "context": []
            })
            return []

        query_embedding = self.embedding_service.generate_embedding(query)

        all_context = []
        for doc in result.data:
            doc_id = doc["id"]
            context_chunks = self.vector_store.search(
                document_id=doc_id,
                query_embedding=query_embedding,
                top_k=3
            )
            all_context.extend(context_chunks)

        execution_log["steps"].append({
            "node_id": node_id,
            "node_type": "knowledgeBase",
            "message": f"Retrieved {len(all_context)} context chunks",
            "context": all_context
        })

        return all_context

    async def _process_llm_engine(
        self,
        query: str,
        context: Optional[List[str]],
        web_search_results: Optional[List[str]],
        config: Dict[str, Any],
        execution_log: Dict[str, Any],
        node_id: str
    ) -> str:
        api_key = config.get("apiKey")
        if not api_key:
            raise ValueError("LLM API key not configured")

        model = config.get("model", "gpt-4o-mini")
        temperature = config.get("temperature", 0.7)
        max_tokens = config.get("maxTokens", 1024)
        system_prompt = config.get("systemPrompt")
        use_web_search = config.get("useWebSearch", False)

        if use_web_search and config.get("webSearchApiKey"):
            web_search_results = await self.llm_service.web_search(
                query=query,
                api_key=config["webSearchApiKey"],
                num_results=3
            )

        response = self.llm_service.generate_response(
            query=query,
            api_key=api_key,
            model=model,
            context=context,
            system_prompt=system_prompt,
            temperature=temperature,
            max_tokens=max_tokens,
            web_search_results=web_search_results,
        )

        execution_log["steps"].append({
            "node_id": node_id,
            "node_type": "llmEngine",
            "model": model,
            "has_context": bool(context),
            "has_web_search": bool(web_search_results),
            "response": response
        })

        return response
