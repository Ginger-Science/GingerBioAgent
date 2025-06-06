import { IAgentRuntime } from "@elizaos/core";
import { sql } from "drizzle-orm";
import { type Route } from "@elizaos/core";

async function getTotalAgents(runtime: IAgentRuntime): Promise<BigInt> {
  const query = sql`SELECT COUNT(*) AS total_agents FROM agents`;
  const totalAgents = await runtime.db.execute(query);
  return totalAgents.rows[0].total_agents as BigInt;
}

type TAgent = {
  id: string;
  name: string;
  system: string;
};

async function getAgents(runtime: IAgentRuntime): Promise<TAgent[]> {
  const query = sql`SELECT id, name, system FROM agents`;
  const agents = await runtime.db.execute(query);
  return agents;
}

export const totalAgents: Route = {
  path: "/totalAgents",
  type: "GET",
  handler: async (_req: any, res: any, runtime: IAgentRuntime) => {
    const totalAgents = await getTotalAgents(runtime);
    res.json({
      result: totalAgents,
    });
  },
};

const agents: Route = {
  path: "/getAgents",
  type: "GET",
  handler: async (_req: any, res: any, runtime: IAgentRuntime) => {
    const agents = await getAgents(runtime);
    res.json({
      result: agents,
    });
  },
};
