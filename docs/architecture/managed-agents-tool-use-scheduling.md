 ## Managed Agents Tool-Use Patterns

Managed Agents support **both MCP and Anthropic-native tools**[(1)](https://platform.claude.com/docs/en/managed-agents/mcp-connector). You configure tools through two separate mechanisms:

**MCP Tools**: You declare MCP servers in the `mcp_servers` array when creating an agent, specifying `type`, `name`, and `url`[(1)](https://platform.claude.com/docs/en/managed-agents/mcp-connector). Then you reference these servers in the `tools` array using an `mcp_toolset` entry[(1)](https://platform.claude.com/docs/en/managed-agents/mcp-connector). For example, to wire up calendar and email tools via MCP:

```python
agent = client.beta.agents.create(
    name="Daily Brief Agent",
    model="claude-opus-4-7",
    mcp_servers=[
        {
            "type": "url",
            "name": "calendar",
            "url": "https://your-calendar-mcp-server.com"
        },
        {
            "type": "url", 
            "name": "email",
            "url": "https://your-email-mcp-server.com"
        }
    ],
    tools=[
        {"type": "mcp_toolset", "mcp_server_name": "calendar"},
        {"type": "mcp_toolset", "mcp_server_name": "email"}
    ]
)
```
[(1)](https://platform.claude.com/docs/en/managed-agents/mcp-connector)

Authentication credentials are provided at session creation via `vault_ids`, not during agent creation[(1)](https://platform.claude.com/docs/en/managed-agents/mcp-connector). This separation keeps secrets out of reusable agent definitions[(1)](https://platform.claude.com/docs/en/managed-agents/mcp-connector).

**Anthropic-Native Tools**: You can also use built-in agent tools like `bash`, `edit`, `read`, `write`, `glob`, `grep`, `web_fetch`, and `web_search` by including an `agent_toolset_20260401` entry in the tools array[(2)](https://platform.claude.com/docs/en/api/csharp/beta/agents).

The MCP toolset defaults to a permission policy of `always_ask`, requiring user approval before each tool call[(1)](https://platform.claude.com/docs/en/managed-agents/mcp-connector). You can configure permission policies per toolset[(1)](https://platform.claude.com/docs/en/managed-agents/mcp-connector)[(2)](https://platform.claude.com/docs/en/api/csharp/beta/agents).

## Managed Agents Scheduling

The available sources do not contain information about cron-style scheduling for Managed Agents specifically. The scheduling documentation provided covers Claude Code's `/loop` command for session-scoped recurring tasks[(3)](https://code.claude.com/docs/en/scheduled-tasks#set-a-one-time-reminder), but this is different from Managed Agents.

For a daily-brief-at-7am use case with Managed Agents, you would likely need to trigger runs from your backend rather than relying on built-in scheduling, though I cannot confirm this definitively from the available documentation.