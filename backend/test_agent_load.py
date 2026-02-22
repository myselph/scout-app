from self_play_agents import SimpleAgentCollection
print("Successfully imported SimpleAgentCollection")
try:
    agent = SimpleAgentCollection.load_default_agent()
    print("Successfully loaded default agent")
except Exception as e:
    print(f"Failed to load agents: {e}")
