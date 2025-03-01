import aiohttp
import json
from typing import Dict, Any, List, Optional

class ComfyUIService:
    def __init__(self, api_url: str):
        """
        Initialize the ComfyUI service.
        
        Args:
            api_url: The URL of the ComfyUI API.
        """
        self.api_url = api_url
        self.client_id = None
    
    async def _get_client_id(self, session: aiohttp.ClientSession) -> str:
        """
        Get a client ID from ComfyUI.
        
        Args:
            session: The aiohttp session.
            
        Returns:
            The client ID.
        """
        if self.client_id is None:
            async with session.get(f"{self.api_url}/client_id") as response:
                if response.status != 200:
                    raise Exception(f"Failed to get client ID: {response.status}")
                
                data = await response.json()
                self.client_id = data.get("client_id")
        
        return self.client_id
    
    async def queue_prompt(self, prompt: Dict[str, Any]) -> Dict[str, Any]:
        """
        Queue a prompt in ComfyUI.
        
        Args:
            prompt: The prompt to queue.
            
        Returns:
            The response from ComfyUI.
        """
        async with aiohttp.ClientSession() as session:
            client_id = await self._get_client_id(session)
            
            # Prepare prompt data
            data = {
                "prompt": prompt,
                "client_id": client_id
            }
            
            # Queue prompt
            async with session.post(f"{self.api_url}/prompt", json=data) as response:
                if response.status != 200:
                    raise Exception(f"Failed to queue prompt: {response.status}")
                
                return await response.json()
    
    async def get_prompt_status(self, prompt_id: str) -> Dict[str, Any]:
        """
        Get the status of a queued prompt.
        
        Args:
            prompt_id: The ID of the prompt.
            
        Returns:
            The status of the prompt.
        """
        async with aiohttp.ClientSession() as session:
            client_id = await self._get_client_id(session)
            
            # Get prompt status
            async with session.get(f"{self.api_url}/history/{prompt_id}") as response:
                if response.status != 200:
                    raise Exception(f"Failed to get prompt status: {response.status}")
                
                data = await response.json()
                
                # Check if the prompt is completed
                outputs = None
                status = "pending"
                
                if data.get(prompt_id, {}).get("outputs"):
                    outputs = data[prompt_id]["outputs"]
                    status = "completed"
                
                return {
                    "status": status,
                    "outputs": outputs
                }
    
    async def get_history(self) -> Dict[str, Any]:
        """
        Get ComfyUI history.
        
        Returns:
            The ComfyUI history.
        """
        async with aiohttp.ClientSession() as session:
            client_id = await self._get_client_id(session)
            
            # Get history
            async with session.get(f"{self.api_url}/history") as response:
                if response.status != 200:
                    raise Exception(f"Failed to get history: {response.status}")
                
                return await response.json()
    
    async def get_object_info(self) -> Dict[str, Any]:
        """
        Get ComfyUI object info.
        
        Returns:
            The ComfyUI object info.
        """
        async with aiohttp.ClientSession() as session:
            # Get object info
            async with session.get(f"{self.api_url}/object_info") as response:
                if response.status != 200:
                    raise Exception(f"Failed to get object info: {response.status}")
                
                return await response.json()
    
    async def get_extensions(self) -> List[str]:
        """
        Get installed ComfyUI extensions.
        
        Returns:
            The list of installed extensions.
        """
        async with aiohttp.ClientSession() as session:
            # Get extensions
            async with session.get(f"{self.api_url}/extensions") as response:
                if response.status != 200:
                    raise Exception(f"Failed to get extensions: {response.status}")
                
                return await response.json()
    
    async def system_stats(self) -> Dict[str, Any]:
        """
        Get ComfyUI system stats.
        
        Returns:
            The system stats.
        """
        async with aiohttp.ClientSession() as session:
            # Get system stats
            async with session.get(f"{self.api_url}/system_stats") as response:
                if response.status != 200:
                    raise Exception(f"Failed to get system stats: {response.status}")
                
                return await response.json()
