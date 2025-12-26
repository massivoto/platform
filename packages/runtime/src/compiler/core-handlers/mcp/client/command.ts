export interface MCPServerCommand {
  tool: string
  command: string
  args: string[]
  // env, stderr and probably more for Stdio
}
